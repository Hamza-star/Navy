import { IsString } from 'class-validator';
import { CreateAlarmDto } from './alarms.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAlarmDto extends PartialType(CreateAlarmDto) {
  @IsString()
  alarmConfigId: string;
}
