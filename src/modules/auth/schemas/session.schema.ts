import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class Session {
  @Prop({ required: true })
  refreshTokenHash: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  sessionKey: string;

  @Prop({ required: true, types: Types.ObjectId })
  user: Types.ObjectId;

  @Prop({ required: true })
  expiryDate: Date;

  createdAt: Date;
  updatedAt: Date;

  @Prop({
    default: null,
  })
  revokedAt?: Date;

  @Prop({ required: true })
  browser: string;

  @Prop({ required: true })
  os: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: false })
  city: string;

  @Prop({ type: [Number] })
  ll: [number];

  @Prop({ required: false })
  timezone: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
