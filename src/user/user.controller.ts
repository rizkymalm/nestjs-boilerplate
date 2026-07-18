import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserService } from './user.service';

// @Get -> 'user/'

// /api/user
@Controller('user')
// @UseGuards(RoleGuard) -> bisa dipakai di sini jika seluruh controller menggunakan guard yang sama
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getUsers(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ): unknown {
    return this.userService.findAllUsers({ page, limit });
  }

  @Get(':id')
  getUserById(@Param('id') id: string): unknown {
    return this.userService.findUserById(id);
  }

  @Post()
  createUser(@Body() CreateUserDto: CreateUserDto): unknown {
    // check
    const data = this.userService.createUser(CreateUserDto);
    return data;
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body() UpdateUserDto: UpdateUserDto,
  ): unknown {
    return this.userService.updateUser(id, UpdateUserDto);
  }
}
