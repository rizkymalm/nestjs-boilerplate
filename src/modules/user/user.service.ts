import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoggerService } from './user.logger';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  public async findAllUsers(pagination: PaginationDto): Promise<User[]> {
    this.logger.log('Finding all users');
    const { page, limit } = pagination;
    return await this.userModel
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  public async findUserById(id: string) {
    this.logger.log('Get user by id');
    const find = await this.userModel.findOne({ _id: id }).exec();
    if (!find) {
      throw new NotFoundException('User not found');
    }
    return find;
  }

  public async createUser(data: CreateUserDto) {
    this.logger.log('Create new user');

    //check user exist
    const userExist = await this.userModel.exists({ username: data.username });
    if (userExist) {
      throw new ConflictException('Username already exist');
    }
    //check email exist
    const emailExist = await this.userModel.exists({ email: data.email });
    if (emailExist) {
      throw new ConflictException('Email already exist');
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = new this.userModel({
      ...data,
      password: hashedPassword,
    });

    return await user.save();
  }

  public async updateUser(id: string, data: UpdateUserDto) {
    //check user exist
    const user = await this.userModel.exists({ _id: id });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const update = await this.userModel.updateOne({ _id: id }, data).exec();

    return update;
  }
}
