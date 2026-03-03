import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Response } from 'express';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { headers: { [k: string]: string } }>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
    (request as { correlationId?: string }).correlationId = correlationId;

    return next.handle().pipe(
      tap(() => {
        response.setHeader('X-Correlation-Id', correlationId);
      }),
    );
  }
}
