import { createHash } from 'crypto';

export interface EnrollVoiceInput {
  sampleBytes: Buffer;
  mimeType: string;
  displayName: string;
  roleLabel?: string;
}

export interface EnrollVoiceResult {
  voiceprintId: string;
  embeddingBase64: string;
}

export interface MatchVoiceInput {
  chunkBytes: Buffer;
  mimeType: string;
  voiceprints: { id: string; embeddingBase64: string }[];
  threshold: number;
}

export interface MatchVoiceResult {
  voiceprintId: string | null;
  score: number;
  uncertain: boolean;
}

export abstract class SpeakerIdProvider {
  abstract enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult>;
  abstract matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult>;
}

/** Deterministic: voiceprint = base64(sha256(sample)), match uses cosine-similarity proxy from hash */
export class DeterministicSpeakerIdProvider implements SpeakerIdProvider {
  async enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult> {
    const hash = createHash('sha256').update(input.sampleBytes).digest();
    const embeddingBase64 = hash.toString('base64');
    const voiceprintId = createHash('sha256')
      .update(Buffer.concat([hash, Buffer.from(input.displayName)]))
      .digest('hex')
      .slice(0, 24);
    return { voiceprintId, embeddingBase64 };
  }

  async matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult> {
    const chunkHash = createHash('sha256').update(input.chunkBytes).digest();
    let best: { id: string; score: number } | null = null;
    for (const vp of input.voiceprints) {
      const buf = Buffer.from(vp.embeddingBase64, 'base64');
      const match = this.similarity(chunkHash, buf);
      if (match >= input.threshold && (!best || match > best.score)) {
        best = { id: vp.id, score: match };
      }
    }
    if (!best) {
      return { voiceprintId: null, score: 0, uncertain: false };
    }
    const uncertain = best.score >= input.threshold && best.score < input.threshold + 0.05;
    return {
      voiceprintId: best.id,
      score: best.score,
      uncertain,
    };
  }

  private similarity(a: Buffer, b: Buffer): number {
    if (a.length !== b.length) return 0;
    if (Buffer.compare(a, b) === 0) return 1;
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
    }
    const normA = Math.sqrt([...a].reduce((s, x) => s + x * x, 0)) || 1;
    const normB = Math.sqrt([...b].reduce((s, x) => s + x * x, 0)) || 1;
    return Math.min(1, Math.max(0, dot / (normA * normB)));
  }
}
