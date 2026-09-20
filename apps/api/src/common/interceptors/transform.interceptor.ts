import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccess } from '@cms/shared';

/** Wraps every successful response as { success: true, data }. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
