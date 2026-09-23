import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Request, Response } from 'express';
import type { ApiError } from '@photography/types';
import { Sentry } from '../../observability/tracing';

/**
 * Global exception filter. Normalizes every thrown error into the {@link ApiError}
 * envelope, maps known database errors to sensible HTTP codes, and never leaks
 * stack traces or internal messages in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      // Forward server errors to Sentry (no-op when SENTRY_DSN is unset).
      Sentry.captureException(exception);
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`);
    }

    const body: ApiError = {
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { status, message: res, error: exception.name };
      }
      const obj = res as { message?: string | string[]; error?: string };
      return {
        status,
        message: obj.message ?? exception.message,
        error: obj.error ?? exception.name,
      };
    }

    if (exception instanceof QueryFailedError) {
      // Postgres unique-violation -> 409
      const code = (exception as QueryFailedError & { code?: string }).code;
      if (code === '23505') {
        return {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        };
      }
      if (code === '23503') {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Related resource not found',
          error: 'Bad Request',
        };
      }
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        error: 'Internal Server Error',
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
