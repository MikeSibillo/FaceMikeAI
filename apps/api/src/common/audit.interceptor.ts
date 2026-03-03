import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const correlationId = (req as Request & { correlationId?: string }).correlationId;
    return next.handle().pipe(
      tap(() => {
        if (process.env.AUDIT_LOG === 'true') {
          console.debug(`[AUDIT] ${method} ${url} correlationId=${correlationId}`);
        }
      }),
    );
  }
}
