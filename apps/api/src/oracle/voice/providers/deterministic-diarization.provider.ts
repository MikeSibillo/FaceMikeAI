import { createHash } from 'crypto';
import {
  DiarizationProvider,
  DiarizeChunkInput,
  DiarizeChunkResult,
  SpeakerTurn,
} from './diarization-provider.interface';

/**
 * Deterministic stub: produces speaker turns based on chunk hash.
 * Fallback labels: SPEAKER_1, SPEAKER_2, ...
 * TYBELOS Voice — AZTEC ORACLE (SAFE)
 */
export class DeterministicDiarizationProvider extends DiarizationProvider {
  async diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult> {
    const sha = createHash('sha256').update(input.audioBytes).digest('hex');
    const durationMs = this.estimateDuration(input.audioBytes, input.sampleRate ?? 16000);
    const turnCount = Math.max(1, Math.min(4, Math.floor(durationMs / 3000)));
    const turns: SpeakerTurn[] = [];
    const chunkSize = Math.floor(durationMs / turnCount);

    for (let i = 0; i < turnCount; i++) {
      const speakerNum = (parseInt(sha.slice(i * 2, i * 2 + 2), 16) % 3) + 1;
      turns.push({
        startMs: i * chunkSize,
        endMs: i < turnCount - 1 ? (i + 1) * chunkSize : durationMs,
        speakerLabel: `SPEAKER_${speakerNum}`,
      });
    }

    return { turns };
  }

  private estimateDuration(bytes: Buffer, sampleRate: number): number {
    const bytesPerSample = 2;
    const bytesPerMs = (sampleRate * bytesPerSample) / 1000;
    return Math.floor(bytes.length / bytesPerMs);
  }
}
