import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ strict: false, collection: 'historical' }) // Flexible for dynamic fields
export class DashboardData extends Document {
  @Prop()
  timestamp: Date;
}

export const DashboardSchema = SchemaFactory.createForClass(DashboardData);
