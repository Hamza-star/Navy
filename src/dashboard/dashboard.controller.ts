// src/dashboard/dashboard.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Dashboard 1 API - basic metrics & charts
   * Query params:
   * mode = 'live' | 'historic' | 'range'
   * start = ISO string (optional, required for historic/range)
   * end = ISO string (optional, required for historic/range)
   */
  @Get('operator-level')
  async getDashboard1(
    @Query('mode') mode: 'live' | 'historic' | 'range',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.dashboardService.getDashboard1Data(mode, start, end);
  }

  /**
   * Dashboard 2 API - engineer-level metrics & charts
   * Query params same as above
   */
  @Get('engineer-level')
  async getDashboard2(
    @Query('mode') mode: 'live' | 'historic' | 'range',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return await this.dashboardService.getDashboard2Data(mode, start, end);
  }
}
