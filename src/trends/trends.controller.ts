/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get('getlist')
  async getList() {
    return this.trendsService.getList();
  }

  @Get('get')
  async getTrends(@Query() query: any) {
    const { startDate, endDate, selectedParams } = query;
    const paramsArray = selectedParams
      ? selectedParams.split(',')
      : ['Genset_Total_kW'];
    return this.trendsService.getTrends({
      startDate,
      endDate,
      selectedParams: paramsArray,
    });
  }
}
