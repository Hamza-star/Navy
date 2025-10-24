import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { FormulasService } from 'src/trends/formulas.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, FormulasService],
})
export class ReportsModule {}
