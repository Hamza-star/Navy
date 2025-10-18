import { Module } from '@nestjs/common';
import { TimestampUpdateService } from './timestamp-update.service';
import { TimestampUpdateController } from './timestamp-update.controller';

@Module({
  controllers: [TimestampUpdateController],
  providers: [TimestampUpdateService],
})
export class TimestampUpdateModule {}
