/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generate(@Body() payload: any) {
    try {
      const result = await this.reportsService.generateReport(payload);
      return {
        success: true,
        count: result.length,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate report',
      };
    }
  }
}
