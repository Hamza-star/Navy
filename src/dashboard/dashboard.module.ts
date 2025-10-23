import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FormulasService } from 'src/trends/formulas.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, FormulasService],
})
export class DashboardModule {}
