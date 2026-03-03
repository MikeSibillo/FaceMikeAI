import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import { DbModule } from './db/db.module';
import { OrgMiddleware } from './common/middleware/org.middleware';
import { OracleVoiceModule } from './oracle/voice/oracle-voice.module';

@Module({
  imports: [DbModule, AuthModule, OracleVoiceModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OrgMiddleware).forRoutes('*');
  }
}
