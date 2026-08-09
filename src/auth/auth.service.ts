import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/user/user.logger';
import { Auth } from './schemas/auth.schema';
import { Connection, Model, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { RegisterUserDto } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/loginUser.dto';
import { TokenService } from './token/token.service';
import { JWTPayload } from './types/jwt-payload.types';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { type IResult } from 'ua-parser-js';
import { Session } from './schemas/session.schema';
import { GeoLocationService } from 'src/common/utils/geolocaion.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    private readonly geoLocation: GeoLocationService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshToken: Model<RefreshToken>,
    @InjectModel(Session.name) private session: Model<Session>,
    private readonly tokenService: TokenService,
  ) {}

  public async registerUser(data: RegisterUserDto) {
    this.logger.log('Register user');
    const session = await this.connection.startSession();
    try {
      const usernameExist = await this.authModel.exists({
        username: data.username,
      });
      if (usernameExist) {
        throw new ConflictException('Username already exist');
      }
      const emailExist = await this.authModel.exists({ email: data.email });
      if (emailExist) {
        throw new ConflictException('Email already exist');
      }
      const createdUser = await session.withTransaction(async () => {
        const salt = 10;
        const hashedPassword = await bcrypt.hash(data.password, salt);
        //insert auth
        const auth = new this.authModel({
          ...data,
          password: hashedPassword,
        });
        const saveAuth = await auth.save({ session });
        //insert user
        const saveUser = new this.userModel({
          ...data,
          auth: saveAuth._id,
        });
        return await saveUser.save({ session });
      });
      return createdUser;
    } finally {
      await session.endSession();
    }
  }

  public async loginUser(data: LoginUserDto, userAgent: IResult, ip: string) {
    const user = await this.authModel.findOne({ email: data.email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    //check password
    const decrypt = await bcrypt.compare(data.password, user.password);
    if (!decrypt) {
      throw new UnauthorizedException('Password not match');
    }

    const payload: JWTPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const sessionKey = uuidv7();
    const token = uuidv4();
    const refreshToken = `${sessionKey}.${token}`;
    const hashedToken = await bcrypt.hash(token, 10);
    await this.storeSession(sessionKey, hashedToken, user._id, userAgent, ip);
    return { accessToken, refreshToken };
  }

  async storeSession(
    key: string,
    token: string,
    user: Types.ObjectId,
    userAgent: IResult,
    ip: string,
  ) {
    const expiryDate = new Date();
    const location = await this.geoLocation.getLocation(ip);
    expiryDate.setDate(expiryDate.getDate() + 7);
    await this.session.create({
      refreshTokenHash: token,
      sessionKey: key,
      user: user,
      expiryDate: expiryDate,
      browser: userAgent.browser.name,
      os: userAgent.os.name,
      ipAddress: ip,
      userAgent: userAgent.ua,
      country: location.country,
      city: location.city,
    });
  }

  async storeUpdateTokenSession(id: Types.ObjectId, token: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await this.session.updateOne(
      {
        _id: id,
      },
      {
        refreshTokenHash: token,
      },
    );
  }

  async refreshTokens(refreshToken: string) {
    const [key, token] = refreshToken.split('.');

    const checkToken = await this.session.findOne({
      sessionKey: key,
      expiryDate: { $gte: new Date() },
      revokedAt: null,
    });
    if (!checkToken) {
      throw new ForbiddenException('Refresh token expired');
    }

    const decrypt = await bcrypt.compare(token, checkToken.refreshTokenHash);
    if (!decrypt) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.authModel.findOne({ _id: checkToken.user });

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload: JWTPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.tokenService.generateAccessToken(payload);
    const newRefreshToken = uuidv4();
    const refreshTokenHashed = await bcrypt.hash(newRefreshToken, 10);
    const refreshTokenWithKey = `${key}.${newRefreshToken}`;
    await this.storeUpdateTokenSession(checkToken._id, refreshTokenHashed);

    return {
      accessToken,
      refreshToken: refreshTokenWithKey,
    };
  }
}
