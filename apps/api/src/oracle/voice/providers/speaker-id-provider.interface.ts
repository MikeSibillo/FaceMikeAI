export interface EnrollVoiceInput {
  sampleBytes: Buffer;
  mimeType: string;
  speakerProfileId: string;
}

export interface EnrollVoiceResult {
  voiceprintId: string;
  embeddingBase64: string;
}

export interface VoiceprintDescriptor {
  voiceprintId: string;
  speakerProfileId: string;
  displayName: string;
  embeddingBase64: string;
}

export interface MatchVoiceInput {
  chunkBytes: Buffer;
  mimeType: string;
  sessionId: string;
  organizationId?: string;
  voiceprints: VoiceprintDescriptor[];
}

export interface VoiceMatch {
  voiceprintId: string;
  speakerProfileId: string;
  speakerDisplayName: string;
  score: number;
}

export interface MatchVoiceResult {
  matches: VoiceMatch[];
  uncertain: boolean;
  collision: boolean;
}

export abstract class SpeakerIdProvider {
  abstract enrollVoice(input: EnrollVoiceInput): Promise<EnrollVoiceResult>;
  abstract matchVoice(input: MatchVoiceInput): Promise<MatchVoiceResult>;
}
