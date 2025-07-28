import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisData, AnalysisSchema } from './schemas/analysis.schema';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller'; // Move controller here
import { MongoDateFilterService } from '../helpers/mongodbfilter-utils';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalysisData.name, schema: AnalysisSchema },
    ]),
  ],
  controllers: [AnalysisController], // Controller moved here
  providers: [AnalysisService, MongoDateFilterService],
  exports: [AnalysisService], // Optional: Only if other modules need it
})
export class AnalysisModule {}
