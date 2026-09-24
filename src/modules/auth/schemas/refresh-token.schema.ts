import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class RefreshToken {
  @Prop({ required: true })
  token: string;

  @Prop({ required: true, types: Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: true })
  expiryDate: Date;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ required: true })
  revokedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
