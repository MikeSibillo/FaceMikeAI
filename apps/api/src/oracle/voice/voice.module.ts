import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceSessionService } from './voice-session.service';
import { VoiceSpeakerService } from './voice-speaker.service';
import { VoiceStorageService } from './voice-storage.service';
import { MeetingBrainService } from './meeting-brain.service';
import { DeterministicSpeechProvider } from './providers/deterministic-speech.provider';
import { DeterministicDiarizationProvider } from './providers/deterministic-diarization.provider';
import { DeterministicSpeakerIdProvider } from './providers/deterministic-speaker-id.provider';

@Module({
  controllers: [VoiceController],
  providers: [
    VoiceSessionService,
    VoiceSpeakerService,
    VoiceStorageService,
    MeetingBrainService,
    DeterministicSpeechProvider,
    DeterministicDiarizationProvider,
    DeterministicSpeakerIdProvider,
  ],
  exports: [VoiceSessionService, VoiceSpeakerService],
})
export class VoiceModule {}
