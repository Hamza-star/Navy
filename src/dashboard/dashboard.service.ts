import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardData } from './schemas/dashboard.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
import { TowerDataProcessor } from 'src/helpers/towerdataformulating-utils';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('DashboardData')
    private readonly DashboardModel: Model<DashboardData>,
    private readonly mongoDateFilter: MongoDateFilterService,
  ) {}

  async getDashboardDataChart1(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
    console.log('Received DashboardDto:', dto);

    const query: any = {};
    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
      console.log('Single date filter:', query.timestamp);
    }
    if (dto.range) {
      try {
        query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
        console.log('Range filter:', query.timestamp);
      } catch (err) {
        console.error('Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
      console.log('Custom date range filter:', query.timestamp);
    }
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
      console.log('Custom time filter:', timeFilter);
    }

    const groupBy =
      dto.range === 'today'
        ? 'hour'
        : dto.range === 'week'
          ? 'day'
          : dto.range === 'month'
            ? 'week'
            : dto.range === 'year'
              ? 'month'
              : 'day';

    console.log(`Grouping by: ${groupBy}, Tower type: ${dto.towerType}`);
    console.log('Final MongoDB Query:', JSON.stringify(query, null, 2));
    const data = await this.DashboardModel.find(query).lean();
    console.log('Fetched documents count:', data.length);
    if (data.length > 0) {
      console.log('Sample document:', data[0]);
    } else {
      console.warn('No documents found for query.');
    }





    const rangeProcessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
      groupBy,
    );

    // Example: log the processed range
    console.log('Processed Range:', JSON.stringify(rangeProcessed, null, 2));

    // Sample response format
    return {
      message: 'Dashboard Data',
      data: {
        range: rangeProcessed,
        // Add other metrics here as needed
      },
    };
  }
}
