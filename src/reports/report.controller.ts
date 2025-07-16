import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './report.service';
import { ReportsDto } from './dto/reports.dto';

@Controller('energy_usage')
export class ReportsController {
  constructor(private readonly ReportsService: ReportsService) {}

  // @Post()
  // async getReports(@Body() dto: ReportsDto): Promise<ReportsDto[]> {
  //   return this.ReportsService.getReports(dto);
  // }
}
