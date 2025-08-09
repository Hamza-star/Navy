import { Module } from '@nestjs/common';
import { LogsDataService } from './logs_data.service';
import { LogsDataController } from './logs_data.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LogEntrySchema } from './schemas/logs.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'LogEntry',
        schema: LogEntrySchema,
      },
    ]),
  ],
  providers: [LogsDataService],
  controllers: [LogsDataController],
})
export class LogsDataModule {}
