import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DeterministicSpeechProvider } from './providers/speech.provider';
import { DeterministicDiarizationProvider } from './providers/diarization.provider';
import { DeterministicSpeakerIdProvider } from './providers/speaker-id.provider';
import { VoiceStorageService } from './voice-storage.service';
import { MeetingBrainService } from './meeting-brain.service';
import { randomUUID } from 'crypto';

const VOICE_ENABLED = process.env.VOICE_ENABLED === 'true';
const VOICE_MATCH_THRESHOLD = parseFloat(process.env.VOICE_MATCH_THRESHOLD || '0.85');

@Injectable()
export class OracleVoiceService {
  private readonly speechProvider = new DeterministicSpeechProvider();
  private readonly diarizationProvider = new DeterministicDiarizationProvider();
  private readonly speakerIdProvider = new DeterministicSpeakerIdProvider();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VoiceStorageService,
    private readonly meetingBrain: MeetingBrainService,
  ) {}

  isEnabled(): boolean {
    return VOICE_ENABLED;
  }

  async createSession(dto: {
    mode?: string;
    organizationId?: string;
    projectId?: string;
    settings?: object;
    userId?: string;
  }) {
    if (!VOICE_ENABLED) {
      throw new BadRequestException('TYBELOS Voice is disabled');
    }
    const correlationId = randomUUID();
    const session = await this.prisma.oracleVoiceSession.create({
      data: {
        mode: dto.mode || 'MODE_PA',
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        settings: dto.settings ? JSON.parse(JSON.stringify(dto.settings)) : undefined,
        createdByUserId: dto.userId,
        correlationId,
        status: 'active',
      },
    });
    return { sessionId: session.id, correlationId };
  }

  async closeSession(sessionId: string) {
    const session = await this.prisma.oracleVoiceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.oracleVoiceSession.update({
      where: { id: sessionId },
      data: { status: 'closed', endedAt: new Date() },
    });
    return { success: true };
  }

  async getTimeline(sessionId: string) {
    const session = await this.prisma.oracleVoiceSession.findUnique({
      where: { id: sessionId },
      include: {
        transcriptSegments: { orderBy: { startMs: 'asc' } },
        meetingEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return {
      segments: session.transcriptSegments,
      events: session.meetingEvents,
    };
  }

  async ingestChunk(
    sessionId: string,
    chunkIndex: number,
    audioBuffer: Buffer,
    mimeType: string,
    sampleRate?: number,
    channels?: number,
  ) {
    if (!VOICE_ENABLED) throw new BadRequestException('TYBELOS Voice is disabled');

    const session = await this.prisma.oracleVoiceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'active') throw new BadRequestException('Session is closed');

    const { storageKey, sha256 } = this.storage.saveChunk(sessionId, chunkIndex, audioBuffer);

    const chunk = await this.prisma.oracleVoiceChunk.create({
      data: {
        sessionId,
        chunkIndex,
        mimeType,
        storageKey,
        bytesSha256: sha256,
        durationMs: 5000,
      },
    });

    const { segments: transSegments, text } = await this.speechProvider.transcribeChunk({
      audioBytes: audioBuffer,
      mimeType,
      sampleRate,
      channels,
      sessionId,
      chunkIndex,
    });

    const { speakerTurns } = await this.diarizationProvider.diarizeChunk({
      audioBytes: audioBuffer,
      mimeType,
      sampleRate,
      channels,
      sessionId,
      chunkIndex,
      transcriptSegments: transSegments,
    });

    const voiceprints = await this.prisma.oracleVoiceprint.findMany({
      where: { revokedAt: null },
      include: { speakerProfile: true },
    });

    const vpList = voiceprints.map((v) => ({
      id: v.id,
      embeddingBase64: v.embeddingEncrypted || '',
    }));

    const profileMap = new Map(voiceprints.map((v) => [v.id, v.speakerProfile]));

    let matchedSpeakerName: string | null = null;
    let matchedSpeakerConfidence: number | null = null;
    if (vpList.length > 0) {
      const match = await this.speakerIdProvider.matchVoice({
        chunkBytes: audioBuffer,
        mimeType,
        voiceprints: vpList,
        threshold: VOICE_MATCH_THRESHOLD,
      });
      if (match.voiceprintId && match.score >= VOICE_MATCH_THRESHOLD) {
        const profile = profileMap.get(match.voiceprintId);
        if (profile) {
          matchedSpeakerName = profile.displayName;
          matchedSpeakerConfidence = match.score;
        }
      }
    }

    const segmentsCreated: string[] = [];
    const extractedRows: { startMs: number; endMs: number; speakerLabel: string; speakerName: string | null; text: string }[] = [];
    for (let i = 0; i < transSegments.length; i++) {
      const seg = transSegments[i]!;
      const turn = speakerTurns[i] || speakerTurns[0];
      const speakerLabel = turn?.speakerLabel ?? 'SPEAKER_1';

      const created = await this.prisma.oracleTranscriptSegment.create({
        data: {
          sessionId,
          chunkId: chunk.id,
          startMs: seg.startMs,
          endMs: seg.endMs,
          speakerLabel,
          speakerName: matchedSpeakerName,
          speakerConfidence: matchedSpeakerConfidence,
          text: seg.text,
          confidence: seg.confidence,
        },
      });
      segmentsCreated.push(created.id);
      extractedRows.push({
        startMs: seg.startMs,
        endMs: seg.endMs,
        speakerLabel,
        speakerName: matchedSpeakerName,
        text: seg.text,
      });
    }

    await this.meetingBrain.extractEvents(sessionId, extractedRows);

    return { accepted: true, chunkId: chunk.id, segmentsCreated };
  }

  async createSpeaker(dto: { displayName: string; roleLabel?: string; organizationId?: string }) {
    const profile = await this.prisma.oracleSpeakerProfile.create({
      data: {
        displayName: dto.displayName,
        roleLabel: dto.roleLabel,
        organizationId: dto.organizationId,
      },
    });
    return profile;
  }

  async enrollVoice(speakerProfileId: string, sampleBuffer: Buffer, mimeType: string) {
    const profile = await this.prisma.oracleSpeakerProfile.findUnique({
      where: { id: speakerProfileId },
    });
    if (!profile) throw new NotFoundException('Speaker profile not found');

    const { embeddingBase64 } = await this.speakerIdProvider.enrollVoice({
      sampleBytes: sampleBuffer,
      mimeType,
      displayName: profile.displayName,
      roleLabel: profile.roleLabel || undefined,
    });

    const vp = await this.prisma.oracleVoiceprint.create({
      data: {
        speakerProfileId,
        provider: process.env.SPEAKER_ID_PROVIDER || 'deterministic',
        embeddingEncrypted: embeddingBase64,
      },
    });
    return { voiceprintId: vp.id };
  }

  async listSpeakers(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};
    return this.prisma.oracleSpeakerProfile.findMany({
      where: { ...where, active: true },
      include: { voiceprints: { where: { revokedAt: null } } },
    });
  }

  async revokeVoiceprint(speakerProfileId: string, voiceprintId: string) {
    const vp = await this.prisma.oracleVoiceprint.findFirst({
      where: { id: voiceprintId, speakerProfileId },
    });
    if (!vp) throw new NotFoundException('Voiceprint not found');
    await this.prisma.oracleVoiceprint.update({
      where: { id: voiceprintId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async generateArtifacts(
    sessionId: string,
    types: string[],
    legalStyle?: string,
  ) {
    const validTypes = ['MINUTES', 'DECISIONS', 'LEGAL_ACT'].filter((t) => types.includes(t));
    if (validTypes.length === 0) validTypes.push('MINUTES');
    return this.meetingBrain.generateArtifacts(
      sessionId,
      validTypes as ('MINUTES' | 'DECISIONS' | 'LEGAL_ACT')[],
      legalStyle,
    );
  }

  async getSessionArtifacts(sessionId: string) {
    return this.prisma.oracleMeetingArtifact.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtifact(artifactId: string) {
    const art = await this.prisma.oracleMeetingArtifact.findUnique({
      where: { id: artifactId },
    });
    if (!art) throw new NotFoundException('Artifact not found');
    return art;
  }
}
