// alarms.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  AlarmAcknowledgement,
  AlarmAcknowledgementSchema,
} from './alarmsAcknowledgment.schema';

@Schema({ collection: 'alarms' })
export class Alarms {
  @Prop({ type: Types.ObjectId, ref: 'AlarmsType', required: true })
  alarmTypeId: Types.ObjectId;

  @Prop({ required: true })
  alarmName: string;

  @Prop({ required: true })
  alarmLocation: string;

  @Prop({ required: true })
  alarmSubLocation: string;

  @Prop({ required: true })
  alarmDevice: string;

  @Prop({ required: true })
  alarmParameter: string;

  // @Prop({ required: true, default: false })
  // alarmStatus: boolean;

  @Prop({ type: [String], default: [] })
  acknowledgementActions: string[];

  @Prop({ type: [AlarmAcknowledgementSchema], default: [] })
  alarmAcknowledgement: AlarmAcknowledgement[];

  // 👇 Reference, not embed
  @Prop({ type: Types.ObjectId, ref: 'AlarmRulesSet', required: true })
  alarmTriggerConfig: Types.ObjectId;
}

export type AlarmsDocument = Alarms & Document;
export const AlarmsSchema = SchemaFactory.createForClass(Alarms);
