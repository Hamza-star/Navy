import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './report.service';
import { ReportsDto } from './dto/reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly ReportsService: ReportsService) {}

  @Post()
  async getReport(@Body() dto: ReportsDto) {
    const data = await this.ReportsService.getReport(dto);
    return { message: 'Realtime Data', data };
  }
}
