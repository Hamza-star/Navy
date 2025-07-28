import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisDto } from './dto/analysis.dto';
import { AnalysisService } from './analysis.service';
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly AnalysisService: AnalysisService) {}

  @Post('cte')
  async getanalysisDataChart1(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart1(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('approach')
  async getanalysisDataChart2(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart2(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('cooling-capacity')
  async getanalysisDataChart3(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart3(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('return-waterflow')
  async getanalysisDataChart4(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart4(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('evaporation-loss')
  async getanalysisDataChart5(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart5(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('drift-loss')
  async getanalysisDataChart6(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart6(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('blowdown-rate')
  async getanalysisDataChart7(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart7(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('makeup-water')
  async getanalysisDataChart8(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart8(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('vibration-analysis')
  async getanalysisDataChart9(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart9(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('PO2')
  async getanalysisDataChart10(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart10(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('ph-levels')
  async getanalysisDataChart11(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart11(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('conductivity')
  async getanalysisDataChart12(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart12(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('corrision-rate')
  async getanalysisDataChart13(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart13(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('fan-speed')
  async getanalysisDataChart14(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart14(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('delta-temperature')
  async getanalysisDataChart15(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart15(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('return-waterflow')
  async getanalysisDataChart16(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart16(dto);
    return { message: 'Analysis Data', data };
  }

  @Post('cooling-watersupply')
  async getanalysisDataChart17(@Body() dto: AnalysisDto) {
    const data = await this.AnalysisService.getAnalysisDataChart17(dto);
    return { message: 'Analysis Data', data };
  }
}
