import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/user/user.logger';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/schemas/user.schema';
import { Auth, AuthSchema } from './schemas/auth.schema';
import { TokenService } from './token/token.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';
import { Session, SessionSchema } from './schemas/session.schema';
import { GeoLocationService } from 'src/common/utils/geolocaion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthSchema },
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [AuthService, LoggerService, TokenService, GeoLocationService],
  exports: [TokenService],
})
export class AuthModule {}
