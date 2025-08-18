import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'alarms' })
export class Alarms extends Document {
  @Prop()
  timestamp: string;
}

export const AlarmsSchema = SchemaFactory.createForClass(Alarms);
