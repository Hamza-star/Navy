import { Controller, Post, Query } from '@nestjs/common';
import { TimestampUpdateService } from './timestamp-update.service';

@Controller('timestamp-update')
export class TimestampUpdateController {
  constructor(private readonly timestampService: TimestampUpdateService) {}

  /**
   * Example:
   * POST /timestamp-update/add?startDate=2024-10-01T00:00:00Z
   */
  @Post('add')
  async addTimestamps(
    @Query('startDate') startDate: string,
    @Query('onlyMissing') onlyMissing?: string,
    @Query('interval') interval?: string,
  ) {
    if (!startDate) {
      return { error: 'Please provide ?startDate=YYYY-MM-DDTHH:mm:ssZ' };
    }

    const onlyMissingDocs = onlyMissing !== 'false';
    const intervalSeconds = interval ? Number(interval) : 3;

    const result = await this.timestampService.addTimestampsToAllDocuments(
      startDate,
      onlyMissingDocs,
      intervalSeconds,
    );

    return { message: result };
  }
}
