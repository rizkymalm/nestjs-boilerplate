import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms'; // Import the type used by jsonwebtoken

export default registerAs('jwt', (): JwtModuleOptions => ({
  secret: process.env.ACCESS_TOKEN_SECRET,
  signOptions: {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,
  },
}));
