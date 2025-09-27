import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './report.service';
import { ReportsDto } from './dto/reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly ReportsService: ReportsService) {}

  @Post()
  async getReport(@Body() dto: ReportsDto) {
    const data = await this.ReportsService.getReport(
      dto as {
        fromDate: string;
        toDate: string;
        startTime?: string;
        endTime?: string;
        towerType: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
        reportType: 'realtime' | 'efficiency';
      },
    );
    return { message: 'Realtime Data', data };
  }
}
