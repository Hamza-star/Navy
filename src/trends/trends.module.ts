import { Module } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { TrendsController } from './trends.controller';
import { FormulasService } from './formulas.service';

@Module({
  controllers: [TrendsController],
  providers: [TrendsService, FormulasService],
})
export class TrendsModule {}
