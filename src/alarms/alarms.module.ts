import { Module } from '@nestjs/common';
import { AlarmsController } from './alarms.controller';
import { AlarmsService } from './alarms.service';
import { HelpersModule } from 'src/helpers/helpers.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AlarmsType, AlarmsTypeSchema } from './schema/alarmsType.schema';
import { Alarms, AlarmsSchema } from './schema/alarms.schema';

@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([
      { name: AlarmsType.name, schema: AlarmsTypeSchema },
      { name: Alarms.name, schema: AlarmsSchema },
    ]),
  ],
  controllers: [AlarmsController],
  providers: [AlarmsService],
})
export class AlarmsModule {}
