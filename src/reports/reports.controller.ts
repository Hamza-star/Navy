/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports/fuel
  @Post('fuel')
  async getFuelReport(@Body() body: any) {
    const { startDate, endDate, fuelCostPerLitre } = body;
    if (!startDate || !endDate || !fuelCostPerLitre) {
      throw new Error('Missing required parameters');
    }

    return this.reportsService.getFuelReport({
      startDate,
      endDate,
      fuelCostPerLitre: +fuelCostPerLitre,
    });
  }
}
