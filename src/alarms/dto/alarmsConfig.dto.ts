import {
  IsString,
  IsBoolean,
  IsMongoId,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AlarmAcknowledgementDto } from './alarmsAcknowledgement.dto';
import { AlarmTriggerConfigDto } from './alarmsTriggerConfig.dto';
import { Types } from 'mongoose';

// create-alarm.dto.ts
export class ConfigAlarmDto {
  @IsMongoId()
  @Transform(({ value }) => new Types.ObjectId(value))
  alarmTypeId: Types.ObjectId;

  @IsString()
  alarmName: string;

  @IsString()
  alarmLocation: string;

  @IsString()
  alarmSubLocation: string;

  @IsString()
  alarmDevice: string;

  @IsString()
  alarmParameter: string;

  @IsBoolean()
  alarmStatus: boolean;

  // ✅ admin-defined actions
  @IsString({ each: true })
  acknowledgementActions: string[];

  // ✅ user acknowledgements
  @ValidateNested({ each: true })
  @Type(() => AlarmAcknowledgementDto)
  alarmAcknowledgement: AlarmAcknowledgementDto[];

  @ValidateNested()
  @Type(() => AlarmTriggerConfigDto)
  alarmTriggerConfig: AlarmTriggerConfigDto;
}
