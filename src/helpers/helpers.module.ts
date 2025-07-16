import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpFetcherService } from './api-utils';
import { DateUtilsService } from './date-utils';
import { MappingSheetService } from './mappingsheet-utils';
@Module({
  imports: [HttpModule],
  providers: [HttpFetcherService, DateUtilsService, MappingSheetService],
  exports: [HttpFetcherService, DateUtilsService, MappingSheetService],
})
export class HelpersModule {}
