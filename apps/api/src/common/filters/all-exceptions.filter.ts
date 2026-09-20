import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiFailure } from '@cms/shared';

interface NestValidationShape {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * One place that turns any thrown thing into the documented error envelope.
 * Stack traces never leave the server in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong. Please try again.';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const shape = body as NestValidationShape;
        if (Array.isArray(shape.message)) {
          message = 'The submitted data is not valid.';
          details = { _errors: shape.message };
        } else if (typeof shape.message === 'string') {
          message = shape.message;
        }
        if (shape.code) code = shape.code;
        if (shape.details) details = shape.details;
      }
      if (code === 'INTERNAL_ERROR') code = httpStatusToCode(status);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      status = mapped.status;
      message = mapped.message;
      code = mapped.code;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: ApiFailure = { success: false, message, code, ...(details ? { details } : {}) };
    response.status(status).json(payload);
  }
}

function httpStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_FAILED';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'RATE_LIMITED';
    default:
      return 'REQUEST_FAILED';
  }
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
  code: string;
} {
  switch (error.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: 'A record with these details already exists.',
        code: 'DUPLICATE_RECORD',
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'A related record referenced here does not exist.',
        code: 'INVALID_REFERENCE',
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'The requested record was not found.',
        code: 'NOT_FOUND',
      };
    default:
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'A database error occurred.',
        code: 'DATABASE_ERROR',
      };
  }
}
