import { createHash } from 'crypto';
import {
  SpeechProvider,
  TranscribeChunkInput,
  TranscribeChunkResult,
  TranscribeSegment,
} from './speech-provider.interface';

/**
 * Deterministic stub provider: processes bytes, computes sha256,
 * produces real segments based on hash mapping for reproducibility.
 * TYBELOS Voice — AZTEC ORACLE (SAFE)
 */
export class DeterministicSpeechProvider extends SpeechProvider {
  async transcribeChunk(input: TranscribeChunkInput): Promise<TranscribeChunkResult> {
    const sha = createHash('sha256').update(input.audioBytes).digest('hex');
    const durationMs = this.estimateDuration(input.audioBytes, input.sampleRate ?? 16000);
    const segmentCount = Math.max(1, Math.min(5, Math.floor(durationMs / 2000)));
    const segments: TranscribeSegment[] = [];
    const chunkSize = Math.floor(durationMs / segmentCount);

    for (let i = 0; i < segmentCount; i++) {
      const startMs = i * chunkSize;
      const endMs = i < segmentCount - 1 ? (i + 1) * chunkSize : durationMs;
      const hashSegment = createHash('sha256')
        .update(Buffer.from(sha + input.chunkIndex + i))
        .digest('hex')
        .slice(0, 8);
      segments.push({
        startMs,
        endMs,
        text: `[Chunk ${input.chunkIndex} seg ${i + 1} ref:${hashSegment}] Transcript placeholder — TYBELOS Voice (deterministic)`,
        confidence: 0.85,
      });
    }

    const fullText = segments.map((s) => s.text).join(' ');
    return { segments, fullText };
  }

  private estimateDuration(bytes: Buffer, sampleRate: number): number {
    const bytesPerSample = 2;
    const bytesPerMs = (sampleRate * bytesPerSample) / 1000;
    return Math.floor(bytes.length / bytesPerMs);
  }
}
