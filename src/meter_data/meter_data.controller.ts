// src/meter_data/meter_data.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { meter_dataService } from './meter_data.service';
import { RealtimeDto } from './dto/realtime.dto';

@Controller('meter-data')
export class meter_dataController {
  constructor(private readonly meterDataService: meter_dataService) {}

  @Post()
  async getFilteredMeterData(@Body() dto: RealtimeDto) {
    const { area, U_selections } = dto;
    const data = await this.meterDataService.getFilteredData(
      area,
      U_selections,
    );
    return { message: 'Filtered data', data };
  }
}
