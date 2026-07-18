import { Types } from 'mongoose';

export type JWTPayload = {
  id: Types.ObjectId;
  username: string;
  email: string;
  role?: Types.ObjectId;
};
