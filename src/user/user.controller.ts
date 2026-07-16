import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';
import { RoleGuard } from 'src/guards/role.guard';

// /api/user
@Controller('user')
// @UseGuards(RoleGuard) -> bisa dipakai di sini jika seluruh controller menggunakan guard yang sama
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  @UseGuards(RoleGuard)
  getUsers(@Query('name') name: string): unknown {
    return this.userService.findAllUsers(name);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  getUserById(@Param('id', ParseIntPipe) id: number): unknown {
    return this.userService.findUserById(id);
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
