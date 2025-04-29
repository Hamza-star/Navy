import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsersDocument = HydratedDocument<Users>;

@Schema({ timestamps: true })
export class Users {
  @Prop({ enum: ['active', 'inactive', 'banned'], default: 'active' })
  userStatus: string;

  @Prop()
  role: string;

  @Prop()
  name: string;

  @Prop()
  username: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
  id: any;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
