import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';

// /api/user
@Controller('user')
export class UserController {
  @Get()
  getUsers(@Query('name') name: string) {
    const users = [
      {
        id: 1,
        name: 'John Doe',
      },
      {
        id: 2,
        name: 'Jane Doe',
      },
    ];
    if (name) {
      return users.filter((data) =>
        data.name.toLocaleLowerCase().includes(name.toLowerCase()),
      );
    }
    return users;
  }
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return { id, name: 'John Doe' };
  }

  @Post()
  createUser(@Body() CreateUserDto: CreateUserDto) {
    return {
      data: CreateUserDto,
      message: 'User created successfully!',
    };
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() UpdateUserDto: UpdateUserDto) {
    return {
      data: {
        id,
        ...UpdateUserDto,
      },
      message: 'User updated successfully',
    };
  }
}
