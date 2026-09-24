import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from './schemas/role.schema';
import { Model, Types } from 'mongoose';
import { CreateRoleDto } from './dto/role-create.dto';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  public async createRole(data: CreateRoleDto) {
    const check = await this.roleModel.countDocuments({ name: data.name });
    if (check) {
      throw new ConflictException('Role name already exist');
    }
    try {
      const save = await this.roleModel.create({
        name: data.name,
      });
      return save;
    } catch (error) {
      const errMessage = error as Error;
      throw new InternalServerErrorException(errMessage);
    }
  }

  public async findRoleById(id: Types.ObjectId) {
    const role = await this.roleModel.findOne({ _id: id });
    if (!role) {
      throw new NotFoundException('Role ID not found');
    }
    return role;
  }
}
