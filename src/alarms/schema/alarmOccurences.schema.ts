import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'alarmsOccurrence', timestamps: true })
export class AlarmOccurrence {
  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ required: true })
  alarmID: string;

  @Prop({ type: Boolean, default: false })
  alarmStatus: boolean;

  // ✅ Link to config
  @Prop({ type: Types.ObjectId, ref: 'alarmsConfiguration', required: true })
  alarmConfigId: Types.ObjectId;

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

  @Prop({ type: Types.ObjectId, ref: 'Users', required: false })
  alarmAcknowledgedBy: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  alarmAcknowledgedDelay: number;

  @Prop({ type: Number, default: 0 })
  alarmAge: number;

  @Prop({ type: Number, default: 0 })
  alarmDuration: number;

  @Prop({ type: String })
  alarmAcknowledgmentType: 'Single' | 'Both' | null;

  @Prop({ type: Boolean, required: false })
  alarmSnooze: boolean;

  @Prop({ type: Date })
  snoozeAt: Date;

  @Prop({ type: Number, required: false })
  snoozeDuration: number;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type AlarmsOccurrenceDocument = AlarmOccurrence & Document;
export const AlarmsOccurrenceSchema =
  SchemaFactory.createForClass(AlarmOccurrence);

// ✅ Add strict compound index to ensure only 1 active alarm per config
AlarmsOccurrenceSchema.index(
  { alarmConfigId: 1, alarmStatus: 1 },
  { unique: true, partialFilterExpression: { alarmStatus: true } },
);
