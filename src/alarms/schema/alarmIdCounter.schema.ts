import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'alarmsIdCounter' })
export class AlarmsIdCounter {
  @Prop({ required: true, unique: true })
  name: string; // e.g. "alarm"

  @Prop({ required: true })
  prefix: number; // e.g. 0 → "00"

  @Prop({ required: true })
  sequence: number; // e.g. 1 → "001"
}

export type AlarmsIdCounterDocument = AlarmsIdCounter & Document;
export const AlarmsIdCounterSchema = SchemaFactory.createForClass(AlarmsIdCounter);

export const AlarmsIdCounterCollectionName = 'alarmsIdCounter';
