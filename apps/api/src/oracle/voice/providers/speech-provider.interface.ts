export interface TranscriptionSegment {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
}

export interface TranscribeChunkInput {
  audioBytes: Buffer;
  mimeType: string;
  sampleRate?: number;
  channels?: number;
  sessionId: string;
  chunkIndex: number;
}

export interface TranscribeChunkResult {
  segments: TranscriptionSegment[];
  fullText: string;
}

export abstract class SpeechProvider {
  abstract transcribeChunk(input: TranscribeChunkInput): Promise<TranscribeChunkResult>;
}
