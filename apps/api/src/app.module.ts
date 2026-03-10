import { Module } from '@nestjs/common';
import { OracleVoiceModule } from './oracle/voice/oracle-voice.module';

@Module({
  imports: [OracleVoiceModule],
})
export class AppModule {}
