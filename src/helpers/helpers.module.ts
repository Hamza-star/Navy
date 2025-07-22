import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HttpFetcherService } from './api-utils';
import { DateUtilsService } from './date-utils';
import { MappingSheetService } from './mappingsheet-utils';
import { MongoDateFilterService } from './mongodbfilter-utils';
import { TowerDataProcessor } from './towerdataformulating-utils';
@Module({
  imports: [HttpModule],
  providers: [
    HttpFetcherService,
    DateUtilsService,
    MappingSheetService,
    MongoDateFilterService,
    TowerDataProcessor,
  ],
  exports: [
    HttpFetcherService,
    DateUtilsService,
    MappingSheetService,
    MongoDateFilterService,
    TowerDataProcessor,
  ],
})
export class HelpersModule {}
