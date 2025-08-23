import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { ConfigAlarmDto } from './dto/alarmsConfig.dto';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { GetAlarmsByTypeDto } from './dto/get-alarms-by-type.dto';
import { GetTypeByAlarmDto } from './dto/get-type-by-alarm.dto';
import { GetUpdateIdDto } from './dto/get-update-id.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { DeleteAlarmDto } from './dto/delete-alarm.dto';

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

  @Get('mapped-location')
  getMappedLocation() {
    return this.alarmsService.getMappedLocation();
  }

  @Put('update-types-alarms')
  update(@Body() dto: GetUpdateIdDto, @Body() updateDto: AlarmsTypeDto) {
    return this.alarmsService.updateAlarmType(dto.typeId, updateDto);
  }

  @Put('update-alarm-config')
  updateAlarm(@Body() dto: UpdateAlarmDto) {
    return this.alarmsService.updateAlarm(dto);
  }

  @Post('delete-types-alarms')
  delete(@Body() dto: GetAlarmsByTypeDto) {
    return this.alarmsService.deleteAlarmType(dto.typeId);
  }

  @Post('delete-alarm-config')
  async deleteAlarm(@Body() dto: DeleteAlarmDto) {
    return this.alarmsService.deleteAlarmByConfigId(dto.alarmConfigId);
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

  @Get('/device-dropdownlist')
  async getDeviceDropdownList() {
    return this.alarmsService.DevicesDropdownList();
  }
  @Post('by-type')
  async getByType(@Body() dto: GetAlarmsByTypeDto) {
    return this.alarmsService.getAlarmsByType(dto.typeId);
  }
  @Post('type-by-alarm')
  getAlarmTypeByAlarmId(@Body() dto: GetTypeByAlarmDto) {
    return this.alarmsService.getAlarmTypeByAlarmId(dto.alarmId);
  }

  @Get('/active-alarms')
  getActiveAlarms() {
    return this.alarmsService.processActiveAlarms();
  }
}
