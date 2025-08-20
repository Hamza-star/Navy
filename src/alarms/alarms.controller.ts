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
import { GetAlarmsByTypeDto } from './dto/get-alarms-by-type.dto';

@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Post('add-types-alarms')
  create(@Body() dto: AlarmsTypeDto) {
    return this.alarmsService.addAlarmType(dto);
  }

  @Get('all-types-alarms')
  findAll() {
    return this.alarmsService.getAllAlarmTypes();
  }

  @Put('update-types-alarms/:id')
  update(@Param('id') id: string, @Body() dto: AlarmsTypeDto) {
    return this.alarmsService.updateAlarmType(id, dto);
  }

  @Delete('delete-types-alarms/:id')
  delete(@Param('id') id: string) {
    return this.alarmsService.deleteAlarmType(id);
  }

  @Post('add-alarm')
  createAlarm(@Body() dto: CreateAlarmDto) {
    return this.alarmsService.addAlarm(dto);
  }

  @Get('intervals')
  getIntervals() {
    return this.alarmsService.getIntervals();
  }

  @Get('time')
  getTime() {
    return this.alarmsService.getTime();
  }

  @Post('by-type')
  async getByType(@Body() dto: GetAlarmsByTypeDto) {
    return this.alarmsService.getAlarmsByType(dto.typeId);
  }
  @Get('type-by-alarm/:alarmId')
  getAlarmTypeByAlarmId(@Param('alarmId') alarmId: string) {
    return this.alarmsService.getAlarmTypeByAlarmId(alarmId);
  }
}
