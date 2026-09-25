import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from 'src/modules/user/user.logger';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/user/schemas/user.schema';
import { Auth, AuthSchema } from './schemas/auth.schema';
import { TokenService } from './token/token.service';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { Session, SessionSchema } from './schemas/session.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { RoleService } from '../role/role.service';
import { GeoLocationService } from '../../common/utils/geolocation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthSchema },
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoggerService,
    TokenService,
    GeoLocationService,
    RoleService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
