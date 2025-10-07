import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HelpersModule } from 'src/helpers/helpers.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardSchema } from './schemas/dashboard.schema';
import { RangeService } from 'src/helpers/tower-metrics.service';
import { MongoService } from 'src/helpers/mongo.data.filter.service';

@Module({
  imports: [
    HttpModule.register({}),
    HelpersModule,
    MongooseModule.forFeature([
      {
        name: 'DashboardData',
        schema: DashboardSchema,
      },
    ]),
  ],
  providers: [DashboardService, RangeService, MongoService],
  controllers: [DashboardController],
  exports: [HttpModule],
})
export class DashboardModule {}
