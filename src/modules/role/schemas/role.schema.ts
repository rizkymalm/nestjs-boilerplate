import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { RoleType } from 'src/common/enums/role.enum';

@Schema({
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
})
export class Role {
  @Prop({
    required: true,
    unique: true,
    type: String,
    enum: Object.values(RoleType),
  })
  name: RoleType;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
