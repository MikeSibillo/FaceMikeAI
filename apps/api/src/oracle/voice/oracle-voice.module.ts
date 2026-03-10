import { Module } from '@nestjs/common';
import { PrismaClient } from '@ai-aztec/db';
import { OracleVoiceController } from './oracle-voice.controller';
import { OracleVoiceService } from './oracle-voice.service';
import { VoiceStorageService } from './storage.service';
import { MeetingBrainService } from './meeting-brain.service';
import { DeterministicSpeechProvider } from './providers/deterministic-speech.provider';
import { DeterministicDiarizationProvider } from './providers/deterministic-diarization.provider';
import { DeterministicSpeakerIdProvider } from './providers/deterministic-speaker-id.provider';

@Module({
  controllers: [OracleVoiceController],
  providers: [
    PrismaClient,
    OracleVoiceService,
    VoiceStorageService,
    MeetingBrainService,
    {
      provide: 'SpeechProvider',
      useClass: DeterministicSpeechProvider,
    },
    {
      provide: 'DiarizationProvider',
      useClass: DeterministicDiarizationProvider,
    },
    {
      provide: 'SpeakerIdProvider',
      useFactory: (prisma: PrismaClient) => new DeterministicSpeakerIdProvider(prisma),
      inject: [PrismaClient],
    },
  ],
})
export class OracleVoiceModule {}
