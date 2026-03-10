import { createHash } from 'crypto';
import { PrismaClient } from '@ai-aztec/db';
import {
  SpeakerIdProvider,
  EnrollVoiceInput,
  EnrollVoiceResult,
  MatchVoiceInput,
  MatchVoiceResult,
} from './speaker-id-provider.interface';

const VOICE_MATCH_THRESHOLD = parseFloat(process.env.VOICE_MATCH_THRESHOLD || '0.85');
const BORDERLINE_LOW = 0.7;

/**
 * Deterministic SpeakerIdProvider: enroll creates voiceprint in DB,
 * match loads voiceprints from DB and compares chunk hash.
 */
export class DeterministicSpeakerIdProvider extends SpeakerIdProvider {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult> {
    const embedding = createHash('sha256')
      .update(input.sampleBytes)
      .update(input.speakerProfileId)
      .digest('base64');

    const vp = await this.prisma.oracleVoiceprint.create({
      data: {
        speakerProfileId: input.speakerProfileId,
        provider: 'deterministic',
        embeddingBase64: embedding,
      },
    });
    return { voiceprintId: vp.id, success: true };
  }

  async matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult | null> {
    const chunkHash = createHash('sha256').update(input.chunkBytes).digest('base64').slice(0, 32);

    const voiceprints = await this.prisma.oracleVoiceprint.findMany({
      where: { revokedAt: null },
      include: { speakerProfile: true },
    });

    let best: { voiceprintId: string; profileId: string; speakerName: string; score: number } | null = null;
    let secondBestScore = 0;

    for (const vp of voiceprints) {
      if (!vp.embeddingBase64) continue;
      const similarity = this._similarity(chunkHash, vp.embeddingBase64);
      if (similarity > (best?.score ?? 0)) {
        secondBestScore = best?.score ?? 0;
        best = {
          voiceprintId: vp.id,
          profileId: vp.speakerProfileId,
          speakerName: vp.speakerProfile.displayName,
          score: similarity,
        };
      } else if (similarity > secondBestScore) {
        secondBestScore = similarity;
      }
    }

    if (!best || best.score < BORDERLINE_LOW) return null;

    const collision = secondBestScore >= VOICE_MATCH_THRESHOLD && Math.abs(best.score - secondBestScore) < 0.05;
    const uncertain = best.score >= BORDERLINE_LOW && best.score < VOICE_MATCH_THRESHOLD;

    if (collision) {
      return { score: best.score, uncertain: true, collision: true };
    }

    return {
      voiceprintId: best.voiceprintId,
      speakerProfileId: best.profileId,
      speakerName: best.speakerName,
      score: best.score,
      uncertain,
    };
  }

  private _similarity(a: string, b: string): number {
    let match = 0;
    const len = Math.min(a.length, b.length, 32);
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) match++;
    }
    return Math.min(1, 0.3 + (match / len) * 0.7);
  }
}
