import { createHash } from 'crypto';
import {
  DiarizationProvider,
  DiarizeChunkInput,
  DiarizeChunkResult,
  SpeakerTurn,
} from './diarization-provider.interface';

/**
 * Deterministic DiarizationProvider: processes bytes, produces speaker turns.
 * Fallback SPEAKER_1, SPEAKER_2 when no identification.
 */
export class DeterministicDiarizationProvider extends DiarizationProvider {
  async diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult> {
    const sha = createHash('sha256').update(input.audioBytes).digest('hex').slice(0, 8);
    const hashNum = parseInt(sha, 16) % 3;

    const turns: SpeakerTurn[] = input.chunkIndex === 0
      ? [
          { startMs: 0, endMs: 1500, speakerLabel: 'SPEAKER_1', confidence: 0.9 },
          { startMs: 1500, endMs: 3500, speakerLabel: 'SPEAKER_2', confidence: 0.85 },
        ]
      : [
          { startMs: 0, endMs: 2000, speakerLabel: 'SPEAKER_1', confidence: 0.88 },
        ];

    return { turns };
  }
}
