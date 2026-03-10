import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class VoiceEnabledGuard implements CanActivate {
  canActivate(): boolean {
    return process.env.VOICE_ENABLED === 'true';
  }
}
