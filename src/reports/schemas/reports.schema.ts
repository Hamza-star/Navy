import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'prime_historical_data' })
export class Reports extends Document {
  @Prop()
  timestamp: string;

  // Dynamic keys like M1_ACTIVE_ENERGY_IMPORT_KWH will be handled at runtime
}

export const ReportsSchema = SchemaFactory.createForClass(Reports);