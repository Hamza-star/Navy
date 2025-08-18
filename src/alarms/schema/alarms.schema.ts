import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'alarms' })
export class Alarms extends Document {
  @Prop()
  type: string;
  alarmName: string;
  alarmLocation: string;
  alarmSubLocation: string;
  alarmDevice: string;
  alarmParameter: string;
  alarmThresholdValue: string;
  alarmAcknowledgement: {
    action: string;
    by: string;
    delay: string;
  };
  alarmTriggerConfiguration: {
    byPersistanceTime: string; //if continuously for 5 sec, 10 sec, 15 sec , 20 sec
    byOccursTime: string; //if Triggers 3 time , 5 time, 10 time, 15 time
  };
  alarmStatus: boolean;
  alarmActiveSince: Date;
}

export const AlarmsSchema = SchemaFactory.createForClass(Alarms);
