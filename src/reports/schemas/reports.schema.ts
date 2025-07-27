import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'historical' })
export class Reports extends Document {
  @Prop()
  timestamp: string;
}

export const ReportsSchema = SchemaFactory.createForClass(Reports);
