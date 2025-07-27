import { Module } from '@nestjs/common';
import { ReportsService } from './report.service';
import { ReportsController } from './report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reports, ReportsSchema } from './schemas/reports.schema';
import { HelpersModule } from 'src/helpers/helpers.module';
@Module({
  imports: [
    HelpersModule,
    MongooseModule.forFeature([{ name: Reports.name, schema: ReportsSchema }]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
