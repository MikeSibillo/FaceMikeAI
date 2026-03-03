import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        // Placeholder: wire to audit service when available
        if (process.env.NODE_ENV !== 'test') {
          console.debug(
            `[Audit] ${method} ${url} user=${user?.id ?? 'anonymous'} ${duration}ms`,
          );
        }
      }),
    );
  }
}
