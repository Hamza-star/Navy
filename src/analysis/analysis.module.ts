import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisData, AnalysisSchema } from './schemas/analysis.schema';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller'; // Move controller here
import { HelpersModule } from 'src/helpers/helpers.module';
@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([
      { name: AnalysisData.name, schema: AnalysisSchema },
    ]),
  ],
  controllers: [AnalysisController], // Controller moved here
  providers: [AnalysisService],
  exports: [AnalysisService], // Optional: Only if other modules need it
})
export class AnalysisModule {}
