/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly DashboardService: DashboardService) {}

  @Post('dashboard-data')
  async getDashoardData(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardData(dto);
    return { message: 'Dashoard Data', data };
  }
}
