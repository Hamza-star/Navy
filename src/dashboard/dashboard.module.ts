import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { HelpersModule } from 'src/helpers/helpers.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardSchema } from './schemas/dashboard.schema';
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
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [HttpModule],
})
export class DashboardModule {}
