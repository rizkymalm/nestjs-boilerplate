import { IsNotEmpty } from 'class-validator';
import { RoleType } from 'src/common/enums/role.enum';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Role name is required' })
  name: RoleType;
}
