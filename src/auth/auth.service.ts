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
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name) private refreshToken: Model<RefreshToken>,
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

  public async loginUser(data: LoginUserDto) {
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
    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, user._id);
    return { accessToken, refreshToken };
  }

  async storeRefreshToken(token: string, user: Types.ObjectId) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await this.refreshToken.create({
      token: token,
      user: user,
      expiryDate: expiryDate,
    });
  }

  async storeUpdateRefreshToken(id: Types.ObjectId, token: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    await this.refreshToken.updateOne(
      {
        _id: id,
      },
      {
        token,
      },
    );
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.refreshToken.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });
    if (!token) {
      throw new ForbiddenException('Refresh token expired');
    }

    const user = await this.authModel.findOne({ _id: token.user });

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
    await this.storeUpdateRefreshToken(token._id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
