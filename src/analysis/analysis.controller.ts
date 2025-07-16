import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisDto } from './dto/analysis.dto';
import { AnalysisService } from './analysis.service';
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly AnalysisService: AnalysisService) {}

  @Post('cte')
  async getAnalysisCTE(@Body() dto: AnalysisDto) {
    console.log('This is the payload', dto);
    const data = await this.AnalysisService.CTEService(dto);
    return {
      message: 'Analysis 1st chart Cooling Tower Effectiveness data',
      data,
    };
  }
}
