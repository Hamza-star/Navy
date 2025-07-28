import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false, collection: 'historical' }) // Flexible for dynamic fields
export class AnalysisData extends Document {
  @Prop()
  timestamp: string;
}

export const AnalysisSchema = SchemaFactory.createForClass(AnalysisData);
