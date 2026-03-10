export interface EnrollVoiceInput {
  sampleBytes: Buffer;
  mimeType: string;
  speakerProfileId: string;
}

export interface EnrollVoiceResult {
  voiceprintId: string;
  success: boolean;
}

export interface MatchVoiceInput {
  chunkBytes: Buffer;
  sessionId: string;
  chunkIndex: number;
}

export interface MatchVoiceResult {
  voiceprintId?: string;
  speakerProfileId?: string;
  speakerName?: string;
  score: number;
  uncertain?: boolean;
  collision?: boolean;
}

export abstract class SpeakerIdProvider {
  abstract enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult>;
  abstract matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult | null>;
}
