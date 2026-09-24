import { RoleType } from '@/common/enums/role.enum';
import { Types } from 'mongoose';

export interface AuthAggregation {
  _id: Types.ObjectId;
  email: string;
  password: string;
  role_detail: {
    name: RoleType;
  };
}
