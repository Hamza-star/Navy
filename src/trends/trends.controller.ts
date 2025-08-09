import { Body, Controller, Get, Post } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { TrendsBodyDto } from './dto/trends.dto';

@Controller('trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get('/getlist')
  async getTrendsDropdownList() {
    return this.trendsService.TrendsDropdownList();
  }
  @Post()
  async getTrends(@Body() body: TrendsBodyDto) {
    return this.trendsService.getTrendData(
      body.start_date, // match the property names in DTO
      body.end_date,
      body.meterIds,
      body.suffixes,
      body.area,
      body.LT_selections,
    );
  }
}
