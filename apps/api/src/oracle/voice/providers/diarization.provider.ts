import { createHash } from 'crypto';

export interface DiarizeChunkInput {
  audioBytes: Buffer;
  mimeType: string;
  sampleRate?: number;
  channels?: number;
  sessionId: string;
  chunkIndex: number;
  transcriptSegments: { startMs: number; endMs: number; text: string }[];
}

export interface SpeakerTurn {
  startMs: number;
  endMs: number;
  speakerLabel: string;
}

export interface DiarizeChunkResult {
  speakerTurns: SpeakerTurn[];
}

export abstract class DiarizationProvider {
  abstract diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult>;
}

/** Deterministic: assigns SPEAKER_1, SPEAKER_2 in alternating order based on chunk hash */
export class DeterministicDiarizationProvider implements DiarizationProvider {
  async diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult> {
    const hash = createHash('sha256').update(input.audioBytes).digest('hex');
    const seed = parseInt(hash.slice(0, 8), 16);
    const speakerTurns: SpeakerTurn[] = input.transcriptSegments.map((seg, i) => ({
      startMs: seg.startMs,
      endMs: seg.endMs,
      speakerLabel: `SPEAKER_${(seed % 2) + (i % 2) + 1}`,
    }));
    return { speakerTurns };
  }
}
