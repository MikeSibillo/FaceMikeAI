import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = request.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      request.user = { id: 'user-1', email: 'test@example.com' };
      return true;
    }
    return true;
  }
}
