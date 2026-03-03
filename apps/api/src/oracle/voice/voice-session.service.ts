import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoiceStorageService } from './voice-storage.service';
import { MeetingBrainService } from './meeting-brain.service';
import { DeterministicSpeechProvider } from './providers/deterministic-speech.provider';
import { DeterministicDiarizationProvider } from './providers/deterministic-diarization.provider';
import { DeterministicSpeakerIdProvider } from './providers/deterministic-speaker-id.provider';
import { v4 as uuidv4 } from 'uuid';
import type { VoiceSessionMode, ArtifactType } from '@prisma/client';

@Injectable()
export class VoiceSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: VoiceStorageService,
    private readonly brain: MeetingBrainService,
    private readonly speech: DeterministicSpeechProvider,
    private readonly diarization: DeterministicDiarizationProvider,
    private readonly speakerId: DeterministicSpeakerIdProvider,
  ) {}

  async createSession(params: {
    mode?: VoiceSessionMode;
    organizationId?: string;
    projectId?: string;
    settings?: object;
    createdByUserId?: string;
  }) {
    const correlationId = uuidv4();
    const session = await this.prisma.oracleVoiceSession.create({
      data: {
        mode: (params.mode as VoiceSessionMode) || 'MODE_PA',
        organizationId: params.organizationId,
        projectId: params.projectId,
        settings: params.settings as object | undefined,
        createdByUserId: params.createdByUserId,
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
    chunkIndex: number,
    audioBuffer: Buffer,
    mimeType: string,
    sampleRate?: number,
    channels?: number,
  ) {
    const { storageKey, sha256 } = await this.storage.saveChunk(sessionId, chunkIndex, audioBuffer);
    const durationMs = this.estimateDuration(audioBuffer, sampleRate ?? 16000);

    const chunk = await this.prisma.oracleVoiceChunk.create({
      data: {
        sessionId,
        chunkIndex,
        mimeType: mimeType || 'audio/wav',
        storageKey,
        bytesSha256: sha256,
        durationMs,
      },
    });

    const diarResult = await this.diarization.diarizeChunk({
      audioBytes: audioBuffer,
      mimeType,
      sampleRate,
      channels,
      sessionId,
      chunkIndex,
    });

    const transcribeResult = await this.speech.transcribeChunk({
      audioBytes: audioBuffer,
      mimeType,
      sampleRate,
      channels,
      sessionId,
      chunkIndex,
    });

    const voiceprints = await this.prisma.oracleVoiceprint.findMany({
      where: { revokedAt: null },
      include: { speakerProfile: true },
    });
    const descriptors = voiceprints.map((vp) => ({
      voiceprintId: vp.id,
      speakerProfileId: vp.speakerProfileId,
      displayName: vp.speakerProfile.displayName,
      embeddingBase64: vp.embeddingBase64 || '',
    }));

    const matchResult = await this.speakerId.matchVoice({
      chunkBytes: audioBuffer,
      mimeType,
      sessionId,
      voiceprints: descriptors,
    });

    const turns = diarResult.turns;
    const segments = transcribeResult.segments;
    const merged: Array<{ startMs: number; endMs: number; speakerLabel: string; text: string; confidence?: number; speakerName?: string; speakerConfidence?: number }> = [];

    for (let i = 0; i < Math.max(segments.length, turns.length); i++) {
      const seg = segments[i] || segments[segments.length - 1];
      const turn = turns[i] || turns[turns.length - 1];
      let speakerName: string | undefined;
      let speakerConfidence: number | undefined;
      if (matchResult.matches.length === 1 && !matchResult.collision) {
        speakerName = matchResult.matches[0].speakerDisplayName;
        speakerConfidence = matchResult.matches[0].score;
      }
      merged.push({
        startMs: seg?.startMs ?? turn.startMs,
        endMs: seg?.endMs ?? turn.endMs,
        speakerLabel: turn?.speakerLabel ?? `SPEAKER_${(i % 3) + 1}`,
        text: seg?.text ?? '',
        confidence: seg?.confidence,
        speakerName,
        speakerConfidence,
      });
    }

    if (merged.length === 0 && segments.length > 0) {
      for (const seg of segments) {
        merged.push({
          startMs: seg.startMs,
          endMs: seg.endMs,
          speakerLabel: 'SPEAKER_1',
          text: seg.text,
          confidence: seg.confidence,
        });
      }
    }

    const created = [];
    for (const m of merged) {
      const seg = await this.prisma.oracleTranscriptSegment.create({
        data: {
          sessionId,
          chunkId: chunk.id,
          startMs: m.startMs,
          endMs: m.endMs,
          speakerLabel: m.speakerLabel,
          text: m.text,
          confidence: m.confidence,
          speakerName: m.speakerName,
          speakerConfidence: m.speakerConfidence,
        },
      });
      created.push(seg);
    }

    await this.brain.extractAndStoreEvents(
      sessionId,
      merged,
      'TYBELOS',
    );

    return { accepted: true, chunkId: chunk.id, segmentsCreated: created.length };
  }

  async getTimeline(sessionId: string) {
    const segments = await this.prisma.oracleTranscriptSegment.findMany({
      where: { sessionId },
      orderBy: { startMs: 'asc' },
    });
    const events = await this.prisma.oracleMeetingEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
    return { segments, events };
  }

  async generateArtifacts(sessionId: string, types: ArtifactType[], legalStyle?: string, generatedBy?: string) {
    const results = [];
    for (const type of types) {
      const art = await this.brain.generateArtifact(sessionId, type, legalStyle, generatedBy);
      results.push(art);
    }
    return results;
  }

  async getArtifacts(sessionId: string) {
    return this.prisma.oracleMeetingArtifact.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArtifact(artifactId: string) {
    return this.prisma.oracleMeetingArtifact.findUnique({
      where: { id: artifactId },
    });
  }

  private estimateDuration(bytes: Buffer, sampleRate: number): number {
    const bytesPerSample = 2;
    const bytesPerMs = (sampleRate * bytesPerSample) / 1000;
    return Math.floor(bytes.length / bytesPerMs);
  }
}
