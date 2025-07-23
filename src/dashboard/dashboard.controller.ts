/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('dashboard-data')
  async getDashoardDataChart1(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart1(dto);
    return { message: 'Dashoard Data', data };
  }
}
