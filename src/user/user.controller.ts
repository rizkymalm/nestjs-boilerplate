import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';

// /api/user
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  getUsers(@Query('name') name: string): unknown {
    return this.userService.findAllUsers(name);
  }
  @Get(':id')
  getUserById(@Param('id') id: string): unknown {
    return this.userService.findUserById(parseInt(id));
  }

  @Post()
  createUser(@Body() CreateUserDto: CreateUserDto): unknown {
    const data = this.userService.createUser(CreateUserDto);
    return {
      data: data,
      message: 'User created successfully!',
    };
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() UpdateUserDto: UpdateUserDto,
  ): unknown {
    return this.userService.updateUser(parseInt(id), UpdateUserDto);
  }
}
