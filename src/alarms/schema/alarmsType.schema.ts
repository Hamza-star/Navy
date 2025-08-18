import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'alarmsType' })
export class AlarmsType extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  priority: number;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  acknowledgeType: string;
}

export const AlarmsTypeSchema = SchemaFactory.createForClass(AlarmsType);
