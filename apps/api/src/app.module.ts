import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { VoiceModule } from './oracle/voice/voice.module';
import { CorrelationMiddleware } from './common/correlation.middleware';

@Module({
  imports: [PrismaModule, VoiceModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
