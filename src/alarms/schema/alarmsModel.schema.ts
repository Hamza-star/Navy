import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class AlarmOccurrence {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: 'alarmsConfiguration', required: false })
  alarmThresholdId: Types.ObjectId | null;

  @Prop({ type: Number, required: false })
  alarmThresholdValue: number | null;

  @Prop({
    type: String,
    enum: ['>', '<', '>=', '<=', '==', '!='],
    required: false,
  })
  alarmThresholdOperator: '>' | '<' | '>=' | '<=' | '==' | '!=' | null;

  @Prop({ type: Number, required: true })
  alarmPresentValue: number;

  @Prop({
    type: String,
    enum: ['Acknowledged', 'Unacknowledged'],
    default: 'Unacknowledged',
  })
  alarmAcknowledgeStatus: 'Acknowledged' | 'Unacknowledged';

  @Prop({ type: String, default: '' })
  alarmAcknowledgmentAction: string;

  @Prop({ type: String, default: '' })
  alarmAcknowledgedBy: string;

  @Prop({ type: Number, default: 0 })
  alarmAcknowledgedDelay: number;

  @Prop({ type: Number, default: 0 })
  alarmAge: number;

  @Prop({ type: Number, default: 0 })
  alarmDuration: number;
}

export const AlarmOccurrenceSchema =
  SchemaFactory.createForClass(AlarmOccurrence);

@Schema({ _id: false })
export class AlarmAcknowledgement {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  by: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  at: Date;

  @Prop({ type: String, default: '' })
  action: string;

  @Prop({ type: Number, default: 0 })
  delay: number;

  @Prop({ type: String, default: '' })
  comment: string;
}

export const AlarmAcknowledgementSchema =
  SchemaFactory.createForClass(AlarmAcknowledgement);

@Schema({ collection: 'alarms', timestamps: true })
export class Alarms {
  @Prop({ required: true })
  alarmID: string;

  @Prop({ type: Types.ObjectId, ref: 'alarmsConfiguration', required: true })
  alarmConfigId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  alarmTimestamp: Date;

  @Prop({ type: Boolean, default: false })
  alarmStatus: boolean;

  @Prop({ type: Number, default: 1 })
  alarmOccurrenceCount: number;

  @Prop({ type: Date })
  alarmFirstOccurrence?: Date;

  @Prop({ type: Date })
  alarmLastOccurrence?: Date;

  @Prop({ type: [AlarmOccurrenceSchema], default: [] })
  alarmOccurrences: AlarmOccurrence[];

  @Prop({
    type: String,
    enum: ['Acknowledged', 'Unacknowledged'],
    default: 'Unacknowledged',
  })
  alarmAcknowledgeStatus: 'Acknowledged' | 'Unacknowledged';

  @Prop({ type: [AlarmAcknowledgementSchema], default: [] })
  acknowledgements: AlarmAcknowledgement[];

  @Prop({ type: String, default: '' })
  alarmAcknowledgmentAction: string;
}

export type AlarmsDocument = Alarms & Document;
export const AlarmsSchema = SchemaFactory.createForClass(Alarms);
export const AlarmsCollectionName = 'alarms';
