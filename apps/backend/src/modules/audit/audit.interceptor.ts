import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { AuditService } from './audit.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
// Hot/noisy paths excluded from the audit trail.
const SKIP = [/\/analytics\/events$/, /\/auth\/refresh$/, /\/payments\/webhook$/];

/**
 * Global audit interceptor. Records every authenticated, state-changing request
 * into `audit_logs` (actor, action, IP, user-agent, status) — append-only trail
 * for security forensics. Reads are not audited.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const shouldAudit =
      MUTATING.has(req.method) &&
      !!req.user &&
      !SKIP.some((re) => re.test(req.originalUrl ?? req.url));

    if (!shouldAudit) return next.handle();

    const action = `${req.method} ${req.route?.path ?? req.url}`;
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        void this.auditService.record({
          actorId: req.user.id,
          action,
          ipAddress: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          statusCode: res.statusCode,
        });
      }),
    );
  }
}
