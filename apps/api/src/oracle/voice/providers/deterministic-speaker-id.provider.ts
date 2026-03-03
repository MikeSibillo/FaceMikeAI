import { createHash } from 'crypto';
import {
  SpeakerIdProvider,
  EnrollVoiceInput,
  EnrollVoiceResult,
  MatchVoiceInput,
  MatchVoiceResult,
  VoiceMatch,
} from './speaker-id-provider.interface';

/**
 * Deterministic stub: embedding = base64(sha256(sample)).
 * Match uses similarity derived from hash overlap with voiceprints from input.
 * TYBELOS Voice — AZTEC ORACLE (SAFE)
 */
export class DeterministicSpeakerIdProvider extends SpeakerIdProvider {
  async enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult> {
    const embeddingBase64 = createHash('sha256').update(input.sampleBytes).digest('base64');
    const voiceprintId = createHash('sha256')
      .update(embeddingBase64 + input.speakerProfileId)
      .digest('hex')
      .slice(0, 36);
    return { voiceprintId, embeddingBase64 };
  }

  async matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult> {
    const chunkEmbedding = createHash('sha256').update(input.chunkBytes).digest('base64');
    const matches: VoiceMatch[] = [];
    const threshold = parseFloat(process.env.VOICE_MATCH_THRESHOLD || '0.85') || 0.85;

    for (const vp of input.voiceprints) {
      const score = this.similarity(chunkEmbedding, vp.embeddingBase64);
      if (score >= threshold) {
        matches.push({
          voiceprintId: vp.voiceprintId,
          speakerProfileId: vp.speakerProfileId,
          speakerDisplayName: vp.displayName,
          score,
        });
      }
    }

    const uncertain = matches.length === 0 && input.chunkBytes.length > 0;
    const collision = matches.length > 1;
    return { matches, uncertain, collision };
  }

  private similarity(a: string, b: string): number {
    let count = 0;
    const len = Math.min(a.length, b.length, 64);
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) count++;
    }
    return Math.min(1, count / 64 + 0.5);
  }
}
