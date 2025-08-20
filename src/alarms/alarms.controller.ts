import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { CreateAlarmDto } from './dto/alarms.dto';
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmTypeService: AlarmsService) {}

  @Post('add-types-alarms')
  async create(@Body() dto: AlarmsTypeDto) {
    return this.alarmTypeService.addAlarmType(dto);
  }

  @Get('all-types-alarms')
  async findAll() {
    return this.alarmTypeService.getAllAlarmTypes();
  }

  // Update (using document ID)
  @Put('update-types-alarms/:id')
  async update(@Param('id') id: string, @Body() dto: AlarmsTypeDto) {
    return this.alarmTypeService.updateAlarmType(id, dto);
  }

  // Delete (using document ID)
  @Delete('delete-types-alarms/:id')
  async delete(@Param('id') id: string) {
    return this.alarmTypeService.deleteAlarmType(id);
  }

  @Post('add-alarm')
  async createAlarm(@Body() dto: CreateAlarmDto) {
    return this.alarmTypeService.addAlarm(dto);
  }
  @Get('intervals')
  getIntervals() {
    return this.alarmTypeService.getIntervals();
  }

  @Get('time')
  getTime() {
    return this.alarmTypeService.getTime();
  }
}
