// dashboard.service.ts
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
    console.log('\n===== STARTING PROCESS =====');
    console.log('Received DashboardDto:', JSON.stringify(dto, null, 2));
    console.log('Current time:', new Date());

    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
      startDate = new Date(dto.date);
      endDate = new Date(dto.date);
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
        query.timestamp = rangeFilter;
        startDate = new Date(rangeFilter.$gte);
        endDate = new Date(rangeFilter.$lte);
      } catch (err) {
        console.error('\n[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      startDate = new Date(dto.fromDate);
      endDate = new Date(dto.toDate);
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
    }

    const groupBy =
      dto.range === 'today' || dto.range === 'yesterday'
        ? 'hour'
        : dto.range === 'week' || dto.range === 'lastWeek'
          ? 'day'
          : dto.range === 'month' || dto.range === 'lastMonth'
            ? 'day'
            : dto.range === 'year' || dto.range === 'lastYear'
              ? 'month'
              : 'day';

    console.log('\n[CONFIG] Grouping strategy:', groupBy);
    console.log('[CONFIG] Tower type:', dto.towerType || 'all');
    console.log('[QUERY] Final MongoDB Query:', JSON.stringify(query, null, 2));

    const data = await this.DashboardModel.find(query).lean();
    console.log('\n[DATA] Fetched documents count:', data.length);

    const rangeProcessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const wetBulb = 25; // Static value for wet bulb temperature
    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
      wetBulb,
    );
    const efficiencyProcessed = TowerDataProcessor.calculateCoolingEfficiency(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
      wetBulb,
    );
    const fanSpeedProcessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const driftLossRate = TowerDataProcessor.calculateDriftLossRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    return {
      message: 'Dashboard Data',
      data: {
        //range: rangeProcessed,
        //approach: approachProcessed,
        //coolingefficiency: efficiencyProcessed,
        //fanSpeed: fanSpeedProcessed,
        driftLossRate: driftLossRate,
      },
    };
  }
}
