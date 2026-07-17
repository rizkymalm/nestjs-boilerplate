import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'createdAt', // 👈 Renames createdAt
    updatedAt: 'updatedAt', // 👈 Renames updatedAt
  },
})
export class User {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Auth' })
  auth: string;

  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Role' })
  role: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
