// alarmsTriggerConfig.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ThresholdCondition {
  @Prop({ required: true })
  value: number;

  @Prop({ enum: ['>', '<', '>=', '<=', '==', '!='], required: true })
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
}

@Schema({ collection: 'alarmsRuleSet' })
export class AlarmRulesSet {
  @Prop() persistenceTime?: number;
  @Prop() occursCount?: number;
  @Prop() occursWithin?: number;
  @Prop({ enum: ['&&', '||', '', 'null'] })
  conditionType: '&&' | '||' | '' | 'null';

  @Prop({ type: [ThresholdCondition], required: true })
  thresholds: ThresholdCondition[];
}

export type AlarmRulesSetDocument = AlarmRulesSet & Document;
export const AlarmRulesSetSchema = SchemaFactory.createForClass(AlarmRulesSet);
