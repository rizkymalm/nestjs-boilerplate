import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestHeaders } from '@/modules/auth/types/jwt-payload.types';
import { ROLES_KEY } from '../decorator/role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return Promise.resolve(true); // Jika tidak ada dekorator @Roles, izinkan akses
    }

    const request = context.switchToHttp().getRequest<RequestHeaders>();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException('Role ID not found in token');
    }

    const hasRole = requiredRoles.includes(`${user.role}`);
    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return Promise.resolve(true);
  }
}
