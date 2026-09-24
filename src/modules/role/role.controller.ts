import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CreateRoleDto } from './dto/role-create.dto';
import { RoleService } from './role.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';
import { Roles } from './decorator/role.decorator';
import { RoleType } from 'src/common/enums/role.enum';

@Controller('role')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(RoleGuard)
  @Roles(RoleType.ADMIN)
  @Post('')
  postCreateRole(@Body() data: CreateRoleDto) {
    return this.roleService.createRole(data);
  }

  @Get('')
  getRoleById(@Query('id') id: Types.ObjectId) {
    return this.roleService.findRoleById(id);
  }
}
