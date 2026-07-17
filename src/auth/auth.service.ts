import { ConflictException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { LoggerService } from 'src/user/user.logger';
import { Auth } from './schemas/auth.schema';
import { Connection, Model } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { RegisterUserDto } from './dto/registerUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @InjectModel(User.name) private userModel: Model<User>,
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
}
