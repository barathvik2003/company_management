import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PermissionKey } from '@cms/shared';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Answers "may this caller perform this action at all?".
 * Which rows they may touch is a separate question, answered by ScopeService.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<PermissionKey | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication required');

    const granted = user.permissions.some((p) => p.key === required);
    if (!granted) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
