import { Module } from '@nestjs/common';
import { AlarmsController } from './alarms.controller';
import { AlarmsService } from './alarms.service';
import { HelpersModule } from 'src/helpers/helpers.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AlarmsType, AlarmsTypeSchema } from './schema/alarmsType.schema';
import { alarmsConfiguration, AlarmsConfigurationSchema } from './schema/alarms.schema';
import {
  AlarmRulesSet,
  AlarmRulesSetSchema,
} from './schema/alarmsTriggerConfig.schema';

@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([
      { name: AlarmsType.name, schema: AlarmsTypeSchema },
      { name: alarmsConfiguration.name, schema: AlarmsConfigurationSchema },
      { name: AlarmRulesSet.name, schema: AlarmRulesSetSchema },
    ]),
  ],
  controllers: [AlarmsController],
  providers: [AlarmsService],
})
export class AlarmsModule {}
