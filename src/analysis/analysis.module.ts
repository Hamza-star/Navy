// analysis.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { HelpersModule } from 'src/helpers/helpers.module'; 
@Module({
  imports: [HttpModule.register({}), HelpersModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [HttpModule],
})
export class AnalysisModule {}
