import { Injectable, Logger } from '@nestjs/common';
import { HttpFetcherService } from 'src/helpers/api-utils';
import { DateUtilsService } from 'src/helpers/date-utils';
import { MappingSheetService } from 'src/helpers/mappingsheet-utils';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly fetcher: HttpFetcherService,
    private readonly mappingSheet: MappingSheetService,
    private readonly dateUtils: DateUtilsService,
  ) {}

  async CTEService(dto: {
    Tower: string;
    start_date: string | Date;
    end_date: string | Date;
  }) {
    const { Tower, start_date, end_date } = dto;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const towerKeys = this.mappingSheet.resolve(Tower);

    try {
      // 1. Fetch data
      const response = await this.fetcher.fetchGet<any>(
        'http://13.234.241.103:1880/ifl_realtime',
      );

      // 2. Handle single object response
      const dataArray = Array.isArray(response) ? response : [response];
      // 3. Filter and map data
      return dataArray
        .filter(
          (item) =>
            item.timestamp &&
            this.dateUtils.isDateWithinRange(
              new Date(item.timestamp),
              startDate,
              endDate,
            ),
        )
        .map((item) => {
          const result: any = { timestamp: item.timestamp };

          // Extract only tower-specific properties
          towerKeys.forEach((key) => {
            if (item.hasOwnProperty(key)) {
              result[key] = item[key];
            }
          });
          result.push({ wetbulb: '25 C' });
          return result;
        });
    } catch (error) {
      this.logger.error(`Error: ${error}`);
      throw error;
    }
  }
}
