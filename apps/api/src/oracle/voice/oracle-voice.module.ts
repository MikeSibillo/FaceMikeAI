import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { OracleVoiceController } from './oracle-voice.controller';
import { OracleVoiceService } from './oracle-voice.service';
import { VoiceStorageService } from './voice-storage.service';
import { MeetingBrainService } from './meeting-brain.service';

@Module({
  imports: [DbModule],
  controllers: [OracleVoiceController],
  providers: [OracleVoiceService, VoiceStorageService, MeetingBrainService],
  exports: [OracleVoiceService],
})
export class OracleVoiceModule {}
