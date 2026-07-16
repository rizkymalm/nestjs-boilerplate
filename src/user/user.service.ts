import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from './user.logger';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}
  private users: User[] = [
    {
      id: 1,
      name: 'Rizki Malem',
      email: 'rizkymalm@gmail.com',
    },
    {
      id: 2,
      name: 'Amajida Zahirah',
      email: 'amajda@gmail.com',
    },
  ];
  findAllUsers(name: string = '') {
    this.logger.log('Finding all users');
    return this.users.filter((data) =>
      data.name.toLocaleLowerCase().includes(name.toLowerCase()),
    );
  }

  findUserById(id: number) {
    this.logger.log('Get user by id');
    const user = this.users.find((data) => data.id === id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  createUser(createdUserDto: CreateUserDto) {
    this.logger.log('Create new user');
    this.users.push(createdUserDto);
    return this.users;
  }

  updateUser(id: number, UpdateUserDto: UpdateUserDto) {
    const user = this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const update = this.users.map((data) =>
      data.id === id
        ? {
            ...data,
            name: UpdateUserDto.name,
            email: UpdateUserDto.email,
          }
        : data,
    );
    return update;
  }
}
