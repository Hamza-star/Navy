import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { ConfigAlarmDto } from './dto/alarmsConfig.dto';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { GetAlarmsByTypeDto } from './dto/get-alarms-by-type.dto';
import { GetTypeByAlarmDto } from './dto/get-type-by-alarm.dto';
import { GetUpdateIdDto } from './dto/get-update-id.dto';

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

  @Put('update-types-alarms')
  update(@Body() dto: GetUpdateIdDto, @Body() updateDto: AlarmsTypeDto) {
    return this.alarmsService.updateAlarmType(dto.typeId, updateDto);
  }

  @Post('delete-types-alarms')
  delete(@Body() dto: GetAlarmsByTypeDto) {
    return this.alarmsService.deleteAlarmType(dto.typeId);
  }

  @Post('add-alarm')
  createAlarm(@Body() dto: ConfigAlarmDto) {
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

  @Get('location')
  getLocation() {
    return this.alarmsService.getLocation();
  }

  @Get('sub-location')
  getSubLocation() {
    return this.alarmsService.getSubLocation();
  }

  @Post('by-type')
  async getByType(@Body() dto: GetAlarmsByTypeDto) {
    return this.alarmsService.getAlarmsByType(dto.typeId);
  }
  @Post('type-by-alarm')
  getAlarmTypeByAlarmId(@Body() dto: GetTypeByAlarmDto) {
    return this.alarmsService.getAlarmTypeByAlarmId(dto.alarmId);
  }
}
