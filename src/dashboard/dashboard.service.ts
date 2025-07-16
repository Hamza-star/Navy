/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { HttpFetcherService } from 'src/helpers/api-utils';
import { DateUtilsService } from 'src/helpers/date-utils';
import { DashboardDto } from './dto/dashboard.dto';
@Injectable()
export class DashboardService {
  constructor(
    private readonly dateservice: DateUtilsService,
    private readonly fetcher: HttpFetcherService,
  ) {}
  async getDashboardData(dto: DashboardDto) {
    // 1. Fetch data
    const response = await this.fetcher.fetchGet<any>(
      'http://13.234.241.103:1880/ifl_realtime',
    );
    return response
  }
}
