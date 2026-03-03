export interface SpeakerTurn {
  startMs: number;
  endMs: number;
  speakerLabel: string;
}

export interface DiarizeChunkInput {
  audioBytes: Buffer;
  mimeType: string;
  sampleRate?: number;
  channels?: number;
  sessionId: string;
  chunkIndex: number;
}

export interface DiarizeChunkResult {
  turns: SpeakerTurn[];
}

export abstract class DiarizationProvider {
  abstract diarizeChunk(input: DiarizeChunkInput): Promise<DiarizeChunkResult>;
}
