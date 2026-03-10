export interface SpeakerTurn {
  startMs: number;
  endMs: number;
  speakerLabel: string;
  confidence?: number;
}

export interface DiarizeChunkInput {
  audioBytes: Buffer;
  mimeType: string;
  sessionId: string;
  chunkIndex: number;
}

export interface DiarizeChunkResult {
  turns: SpeakerTurn[];
}

export abstract class DiarizationProvider {
  abstract diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult>;
}
