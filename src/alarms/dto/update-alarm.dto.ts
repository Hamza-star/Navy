import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { ConfigAlarmDto } from './alarmsConfig.dto';

export class UpdateAlarmDto extends PartialType(ConfigAlarmDto) {
  @IsString()
  alarmConfigId: string;
}
