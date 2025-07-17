import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpFetcherService } from './api-utils';
import { DateUtilsService } from './date-utils';
import { MappingSheetService } from './mappingsheet-utils';
import { MongoDateFilterService } from './mongodbfilter-utils';
import { DataFilterUtils } from './datafilter-utils';
import { TowerDataProcessor } from './towerdataformulating-utils';
@Module({
  imports: [HttpModule],
  providers: [
    HttpFetcherService,
    DateUtilsService,
    MappingSheetService,
    MongoDateFilterService,
    DataFilterUtils,
    TowerDataProcessor,
  ],
  exports: [
    HttpFetcherService,
    DateUtilsService,
    MappingSheetService,
    MongoDateFilterService,
    DataFilterUtils,
    TowerDataProcessor,
  ],
})
export class HelpersModule {}
