// ...existing code...
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  // reference to AlarmConfig document
  @Prop({ type: Types.ObjectId, ref: 'alarmsConfiguration', required: true })
  alarmConfigId: Types.ObjectId;

  // the actual event timestamp
  @Prop({ type: Date, required: true })
  alarmTimestamp: Date;

  // status and occurrence metadata
  @Prop({ type: Boolean, default: false })
  alarmStatus: boolean;

  @Prop({ type: Number, default: 1 })
  alarmOccurrenceCount: number;

  @Prop({ type: Date })
  alarmFirstOccurrence?: Date;

  @Prop({ type: Date })
  alarmLastOccurrence?: Date;

  @Prop({ type: [Date], default: [] })
  recentOccurrences: Date[];

  @Prop({ type: Number, default: 0 })
  alarmAge: number;

  @Prop({ type: Number, default: 0 })
  alarmDuration: number;

  // value/threshold information
  // reference to the threshold subdocument (_id from AlarmRulesSet.thresholds)
  @Prop({ type: Types.ObjectId, ref: 'alarmsConfiguration', required: false })
  alarmThresholdId?: Types.ObjectId;

  // snapshot of threshold at time of firing (recommended)
  @Prop({ type: Number, required: false })
  alarmThresholdValue?: number;

  @Prop({
    type: String,
    enum: ['>', '<', '>=', '<=', '==', '!='],
    required: false,
  })
  alarmThresholdOperator?: '>' | '<' | '>=' | '<=' | '==' | '!=';

  @Prop({ type: Number, required: false })
  alarmPresentValue?: number;

  // convenience current acknowledge status (derived from acknowledgements if desired)
  @Prop({
    type: String,
    enum: ['Acknowledged', 'Unacknowledged'],
    default: 'Unacknowledged',
  })
  alarmAcknowledgeStatus: 'Acknowledged' | 'Unacknowledged';

  // history / audit of acknowledgements
  @Prop({ type: [AlarmAcknowledgementSchema], default: [] })
  acknowledgements: AlarmAcknowledgement[];

  // optional latest/high-level action string
  @Prop({ type: String, default: '' })
  alarmAcknowledgmentAction: string;
}

export type AlarmsDocument = Alarms & Document;
export const AlarmsSchema = SchemaFactory.createForClass(Alarms);
export const AlarmsCollectionName = 'alarms';
