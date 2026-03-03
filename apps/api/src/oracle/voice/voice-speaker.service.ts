import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeterministicSpeakerIdProvider } from './providers/deterministic-speaker-id.provider';

@Injectable()
export class VoiceSpeakerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly speakerId: DeterministicSpeakerIdProvider,
  ) {}

  async createSpeaker(displayName: string, roleLabel?: string, organizationId?: string) {
    return this.prisma.oracleSpeakerProfile.create({
      data: { displayName, roleLabel, organizationId },
    });
  }

  async listSpeakers(organizationId?: string) {
    return this.prisma.oracleSpeakerProfile.findMany({
      where: organizationId ? { organizationId, active: true } : { active: true },
      include: { voiceprints: { where: { revokedAt: null } } },
    });
  }

  async enrollVoice(speakerProfileId: string, sampleBytes: Buffer, mimeType: string) {
    const profile = await this.prisma.oracleSpeakerProfile.findUnique({
      where: { id: speakerProfileId },
    });
    if (!profile) throw new Error('Speaker profile not found');

    const result = await this.speakerId.enrollVoice({
      sampleBytes,
      mimeType,
      speakerProfileId,
    });

    const vpCreated = await this.prisma.oracleVoiceprint.create({
      data: {
        speakerProfileId,
        provider: process.env.SPEAKER_ID_PROVIDER || 'deterministic',
        embeddingBase64: result.embeddingBase64,
      },
    });
    return { voiceprintId: vpCreated.id };

  }

  async revokeVoiceprint(speakerProfileId: string, voiceprintId: string) {
    const vp = await this.prisma.oracleVoiceprint.findFirst({
      where: { id: voiceprintId, speakerProfileId },
    });
    if (!vp) throw new Error('Voiceprint not found');
    await this.prisma.oracleVoiceprint.update({
      where: { id: voiceprintId },
      data: { revokedAt: new Date() },
    });
  }
}
