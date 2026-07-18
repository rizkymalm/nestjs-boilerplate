import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { LoggerService } from 'src/user/user.logger';
import { JWTPayload } from '../types/jwt-payload.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }
    try {
      const payload: JWTPayload = this.jwtService.verify(token);
      request['id'] = payload.id;
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.log(errorMessage);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }
}
