import { RoleType } from '../../../common/enums/role.enum';
import { Request } from 'express';
import { Types } from 'mongoose';

export type JWTPayload = {
  id: Types.ObjectId;
  email: string;
  role?: RoleType;
};

export interface RequestHeaders extends Request {
  user: JWTPayload;
}
