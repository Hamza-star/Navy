/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Post, Body } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  // 🔹 GET all params list
  @Get('getlist')
  async getList() {
    return this.trendsService.getList();
  }

  // 🔹 POST: get data for selected params
  @Post()
  async getTrends(@Body() body: any) {
    return this.trendsService.getTrends(body);
  }
}
