import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWTPayload } from '../types/jwt-payload.types';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}
  async generateAccessToken(payload: JWTPayload) {
    const token = await this.jwtService.signAsync(payload);
    return token;
  }
}
