import { createHash } from 'crypto';
import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, OracleVoiceSessionMode } from '@ai-aztec/db';
import { SpeechProvider } from './providers/speech-provider.interface';
import { DiarizationProvider } from './providers/diarization-provider.interface';
import { SpeakerIdProvider } from './providers/speaker-id-provider.interface';
import { VoiceStorageService } from './storage.service';
import { MeetingBrainService, SegmentWithSpeaker } from './meeting-brain.service';

const VOICE_MATCH_THRESHOLD = parseFloat(process.env.VOICE_MATCH_THRESHOLD || '0.85');

@Injectable()
export class OracleVoiceService {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject('SpeechProvider') private readonly speech: SpeechProvider,
    @Inject('DiarizationProvider') private readonly diarization: DiarizationProvider,
    @Inject('SpeakerIdProvider') private readonly speakerId: SpeakerIdProvider,
    private readonly storage: VoiceStorageService,
    private readonly meetingBrain: MeetingBrainService,
  ) {}

  async createSession(dto: {
    mode?: OracleVoiceSessionMode;
    organizationId?: string;
    projectId?: string;
    settings?: Record<string, unknown>;
    createdByUserId?: string;
  }) {
    const correlationId = uuidv4();
    const session = await this.prisma.oracleVoiceSession.create({
      data: {
        mode: dto.mode ?? 'MODE_PA',
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        settings: (dto.settings ?? undefined) as object | undefined,
        createdByUserId: dto.createdByUserId,
        correlationId,
      },
    });
    return { sessionId: session.id, correlationId };
  }

  async closeSession(sessionId: string) {
    await this.prisma.oracleVoiceSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endedAt: new Date() },
    });
  }

  async ingestChunk(
    sessionId: string,
    audioBuffer: Buffer,
    chunkIndex: number,
    mimeType: string,
    sampleRate?: number,
    channels?: number,
  ) {
    const sha256 = createHash('sha256').update(audioBuffer).digest('hex');
    const durationMs = Math.max(0, Math.floor((audioBuffer.length / (sampleRate || 16000) / (channels || 1) / 2) * 1000));

    const chunk = await this.prisma.oracleVoiceChunk.create({
      data: {
        sessionId,
        chunkIndex,
        mimeType: mimeType || 'audio/wav',
        bytesSha256: sha256,
        durationMs: durationMs || undefined,
      },
    });

    this.storage.ensureDir();
    const storageKey = `${sessionId}/${chunk.id}.bin`;
    this.storage.saveChunk(sessionId, chunk.id, audioBuffer);

    await this.prisma.oracleVoiceChunk.update({
      where: { id: chunk.id },
      data: { storageKey },
    });

    const [transcription, diarizationResult] = await Promise.all([
      this.speech.transcribeChunk({
        audioBytes: audioBuffer,
        mimeType: mimeType || 'audio/wav',
        sampleRate,
        channels,
        sessionId,
        chunkIndex,
      }),
      this.diarization.diarizeChunk({
        audioBytes: audioBuffer,
        mimeType: mimeType || 'audio/wav',
        sessionId,
        chunkIndex,
      }),
    ]);

    const matchResult = await this.speakerId.matchVoice({
      chunkBytes: audioBuffer,
      sessionId,
      chunkIndex,
    });

    const turns = diarizationResult.turns;
    const segments = transcription.segments;

    const mergedSegments: Array<{
      startMs: number;
      endMs: number;
      speakerLabel: string;
      text: string;
      confidence: number;
      speakerName?: string;
      speakerConfidence?: number;
    }> = [];

    if (turns.length >= segments.length) {
      for (let i = 0; i < segments.length; i++) {
        const turn = turns[Math.min(i, turns.length - 1)];
        const seg = segments[i];
        const speakerName = matchResult && matchResult.score >= VOICE_MATCH_THRESHOLD && !matchResult.collision
          ? matchResult.speakerName
          : undefined;
        const speakerConf = matchResult?.score;
        if (matchResult?.uncertain && matchResult?.collision) {
          await this.meetingBrain.emitEvent(sessionId, 'UNCERTAIN_SPEAKER', {
            chunkIndex,
            score: matchResult.score,
            message: 'Richiede conferma umana',
          }, 'TYBELOS');
        }
        mergedSegments.push({
          startMs: seg.startMs,
          endMs: seg.endMs,
          speakerLabel: turn.speakerLabel,
          text: seg.text,
          confidence: seg.confidence,
          speakerName,
          speakerConfidence: speakerConf,
        });
      }
    } else {
      for (const seg of segments) {
        const turn = turns[0] ?? { startMs: 0, endMs: 99999, speakerLabel: 'SPEAKER_1' };
        mergedSegments.push({
          startMs: seg.startMs,
          endMs: seg.endMs,
          speakerLabel: turn.speakerLabel,
          text: seg.text,
          confidence: seg.confidence,
          speakerName: matchResult && matchResult.score >= VOICE_MATCH_THRESHOLD ? matchResult.speakerName : undefined,
          speakerConfidence: matchResult?.score,
        });
      }
    }

    const created = await this.prisma.oracleTranscriptSegment.createMany({
      data: mergedSegments.map((s) => ({
        sessionId,
        chunkId: chunk.id,
        startMs: s.startMs,
        endMs: s.endMs,
        speakerLabel: s.speakerLabel,
        text: s.text,
        confidence: s.confidence,
        speakerName: s.speakerName,
        speakerConfidence: s.speakerConfidence,
      })),
    });

    const segsForBrain: SegmentWithSpeaker[] = mergedSegments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      speakerLabel: s.speakerLabel,
      speakerName: s.speakerName,
      text: s.text,
      confidence: s.confidence,
    }));
    await this.meetingBrain.extractAndSaveEvents(sessionId, segsForBrain);

    return { accepted: true, chunkId: chunk.id, segmentsCreated: created.count };
  }

  async getTimeline(sessionId: string): Promise<{ segments: unknown[]; events: unknown[] }> {
    const [segments, events] = await Promise.all([
      this.prisma.oracleTranscriptSegment.findMany({
        where: { sessionId },
        orderBy: [{ startMs: 'asc' }],
      }),
      this.prisma.oracleMeetingEvent.findMany({
        where: { sessionId },
        orderBy: [{ createdAt: 'asc' }],
      }),
    ]);
    return { segments, events };
  }

  async createSpeaker(dto: { displayName: string; roleLabel?: string; organizationId?: string }) {
    return this.prisma.oracleSpeakerProfile.create({
      data: { ...dto, roleLabel: dto.roleLabel ?? undefined },
    });
  }

  async enrollSpeaker(speakerId: string, sampleBuffer: Buffer, mimeType: string) {
    const result = await this.speakerId.enrollVoice({
      sampleBytes: sampleBuffer,
      mimeType,
      speakerProfileId: speakerId,
    });
    return { voiceprintId: result.voiceprintId };
  }

  async listSpeakers(organizationId?: string) {
    return this.prisma.oracleSpeakerProfile.findMany({
      where: organizationId ? { organizationId, active: true } : { active: true },
      include: { voiceprints: { where: { revokedAt: null } } },
    });
  }

  async revokeVoiceprint(speakerId: string, voiceprintId: string) {
    await this.prisma.oracleVoiceprint.updateMany({
      where: { id: voiceprintId, speakerProfileId: speakerId },
      data: { revokedAt: new Date() },
    });
  }

  async generateArtifacts(
    sessionId: string,
    types: Array<'MINUTES' | 'DECISIONS' | 'LEGAL_ACT'>,
    legalStyle?: string,
  ) {
    const memory = await this.meetingBrain.loadMemory(sessionId);
    const results: Array<{ type: string; id: string }> = [];

    for (const t of types) {
      let contentMarkdown = '';
      if (t === 'MINUTES') contentMarkdown = this.meetingBrain.generateMinutes(memory);
      else if (t === 'DECISIONS') contentMarkdown = this.meetingBrain.generateDecisions(memory);
      else if (t === 'LEGAL_ACT') contentMarkdown = this.meetingBrain.generateLegalAct(memory, legalStyle);

      const checksum = MeetingBrainService.contentToChecksum(contentMarkdown);
      const contentJson = {
        segments: memory.segments,
        actionItems: memory.actionItems,
        decisionProposals: memory.decisionProposals,
        riskFlags: memory.riskFlags,
      };

      const artifact = await this.prisma.oracleMeetingArtifact.create({
        data: {
          sessionId,
          type: t,
          contentMarkdown,
          contentJson: contentJson as object,
          checksumSha256: checksum,
          generatedBy: 'TYBELOS',
        },
      });
      results.push({ type: t, id: artifact.id });
    }
    return results;
  }

  async getArtifacts(sessionId: string): Promise<unknown[]> {
    return this.prisma.oracleMeetingArtifact.findMany({
      where: { sessionId },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getArtifact(artifactId: string): Promise<unknown | null> {
    return this.prisma.oracleMeetingArtifact.findUnique({
      where: { id: artifactId },
    });
  }
}
