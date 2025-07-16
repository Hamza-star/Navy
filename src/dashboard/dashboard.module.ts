import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { HelpersModule } from 'src/helpers/helpers.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [HttpModule.register({}), HelpersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [HttpModule],
})
export class DashboardModule {}
