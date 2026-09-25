import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/modules/user/user.logger';
import { Auth } from './schemas/auth.schema';
import mongoose, { Connection, Model, Types } from 'mongoose';
import { RegisterUserDto } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/loginUser.dto';
import { TokenService } from './token/token.service';
import { JWTPayload } from './types/jwt-payload.types';
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { type IResult } from 'ua-parser-js';
import { Session } from './schemas/session.schema';
import { GeoLocationService } from '../../common/utils/geolocation.service';
import { User } from '../user/schemas/user.schema';
import { aggregateSingle } from '../../common/database/mongoose/aggregate-single';
import { AuthAggregation } from './types/auth-aggregation.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    private readonly geoLocation: GeoLocationService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private session: Model<Session>,
    private readonly tokenService: TokenService,
  ) {}

  public async registerUser(data: RegisterUserDto) {
    this.logger.log('Register user');
    const session = await this.connection.startSession();
    try {
      const existingUser = await this.authModel
        .findOne({
          $or: [
            { username: data.username },
            { email: data.email },
            { phone: data.phone },
          ],
        })
        .lean();

      // logic existing user
      if (existingUser) {
        if (existingUser.username === data.username) {
          throw new ConflictException('Username already exists');
        }
        if (existingUser.email === data.email) {
          throw new ConflictException('Email already exists');
        }
        if (existingUser.phone === data.phone) {
          throw new ConflictException('Phone number already exists');
        }
      }

      const createdUser = await session.withTransaction(async () => {
        const salt = 10;
        const hashedPassword = await bcrypt.hash(data.password, salt);
        //insert auth
        const auth = new this.authModel({
          ...data,
          role: new mongoose.Types.ObjectId(data.role),
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

  async findUserLogin(data: LoginUserDto): Promise<AuthAggregation> {
    const findUser = await aggregateSingle<Auth, AuthAggregation>(
      this.authModel,
      [
        {
          $match: {
            email: data.email,
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role_detail',
          },
        },
        {
          $unwind: {
            path: '$role_detail',
            preserveNullAndEmptyArrays: true,
          },
        },
      ],
    );

    if (!findUser) {
      throw new UnauthorizedException('User not found');
    } else {
      const user = findUser;
      //check password
      const decrypt = await bcrypt.compare(data.password, findUser.password);
      if (!decrypt) {
        throw new UnauthorizedException('Password not match');
      }
      return user;
    }
  }

  async findAuthById(id: Types.ObjectId) {
    const findAuth = await aggregateSingle<Auth, AuthAggregation>(
      this.authModel,
      [
        {
          $match: {
            _id: id,
          },
        },
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'role_detail',
          },
        },
        {
          $unwind: {
            path: '$role_detail',
            preserveNullAndEmptyArrays: true,
          },
        },
      ],
    );

    return findAuth;
  }

  public async loginUser(data: LoginUserDto, userAgent: IResult, ip: string) {
    const user = await this.findUserLogin(data);
    const payload: JWTPayload = {
      id: user._id,
      email: user.email,
      role: user.role_detail.name,
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
      auth: user,
      expiryDate: expiryDate,
      browser: userAgent.browser.name,
      os: userAgent.os.name,
      ipAddress: ip,
      userAgent: userAgent.ua,
      country: location.country,
      city: location.city,
      ll: location.ll,
      timezone: location.timezone,
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

    const user = await this.findAuthById(checkToken.auth);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload: JWTPayload = {
      id: user._id,
      email: user.email,
      role: user.role_detail.name,
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
