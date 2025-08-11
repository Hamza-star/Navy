/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

    const data = await this.DashboardModel.find(query).lean();

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
    const coolingCapacity = TowerDataProcessor.calculateCoolingCapacity(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const waterEfficiency = TowerDataProcessor.calculateWaterEfficiencyIndex(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const waterConsumption = TowerDataProcessor.calculateWaterConsumption(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const avgEnergyUsage = TowerDataProcessor.calculateAverageEnergyUsage(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        range: rangeProcessed,
        approach: approachProcessed,
        coolingefficiency: efficiencyProcessed,
        coolingCapacity: coolingCapacity,
        waterEfficiency: waterEfficiency,
        waterConsumption: waterConsumption,
        energyUsage: avgEnergyUsage,
      },
    };
  }

  async getDashboardDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

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

    return {
      message: 'Dashboard Data',
      data: {
        approach: approachProcessed,
        coolingefficiency: efficiencyProcessed,
      },
    };
  }

  async getDashboardDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const rangeProcessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const fanSpeedProcessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        range: rangeProcessed,
        fanSpeed: fanSpeedProcessed,
      },
    };
  }

  async getDashboardDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const driftLossRate = TowerDataProcessor.calculateDriftLossRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const evaporationLossRate = TowerDataProcessor.calculateEvaporationLossRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const blowdownData = TowerDataProcessor.calculateBlowdownRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    // const makeupWaterData = TowerDataProcessor.calculateMakeupWater(
    //   data,
    //   dto.towerType || 'all',
    //   groupBy,
    //   startDate,
    //   endDate,
    // );
    // const coolingCapacity = TowerDataProcessor.calculateCoolingCapacity(
    //   data,
    //   dto.towerType || 'all',
    //   groupBy,
    //   startDate,
    //   endDate,
    // );
    const waterEfficiency = TowerDataProcessor.calculateWaterEfficiencyIndex(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        driftLossRate: driftLossRate,
        evaporationLossRate: evaporationLossRate,
        blowDownRate: blowdownData,
        // makeupWater: makeupWaterData,
        // coolingCapacity: coolingCapacity,
        waterEfficiency: waterEfficiency,
      },
    };
  }

  async getDashboardDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    return {
      message: 'Dashboard Data',
      data: {
        COC: 0,
        conductivity: 0,
      },
    };
  }

  async getDashboardDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const fanPowerConsumption = TowerDataProcessor.calculateFanPowerConsumption(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const fanEfficiency = TowerDataProcessor.calculateFanEfficiencyIndex(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    return {
      message: 'Dashboard Data',
      data: {
        fanPower: fanPowerConsumption,
        fanEfficiencyIndex: fanEfficiency,
      },
    };
  }

  async getDashboardDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

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

    const coolingCapacity = TowerDataProcessor.calculateCoolingCapacity(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        range: rangeProcessed,
        approach: approachProcessed,
        coolingCapacity: coolingCapacity,
      },
    };
  }

  async getDashboardDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
    const match: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range && dto.fromDate && dto.toDate) {
      startDate = new Date(dto.fromDate);
      endDate = new Date(dto.toDate);
    } else if (dto.date) {
      const date = new Date(dto.date);
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else {
      throw new Error('Date or range is required');
    }

    const groupByFormat = dto.range?.includes('year')
      ? '%Y-%m'
      : dto.range?.includes('month')
        ? '%Y-%m-%d'
        : '%Y-%m-%d %H:00';

    const pipeline: any[] = [
      {
        $addFields: {
          parsedTimestamp: { $toDate: '$timestamp' },
        },
      },
      {
        $match: {
          parsedTimestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $project: {
          timestamp: '$parsedTimestamp',
          CHCT1_flow: '$CHCT1_FM_02_FR',
          CHCT1_hot: '$CHCT1_TEMP_RTD_02_AI',
          CHCT1_cold: '$CHCT1_TEMP_RTD_01_AI',
          CHCT1_speed: '$CHCT1_INV_01_SPD_AI',
          CHCT2_flow: '$CHCT2_FM_02_FR',
          CHCT2_hot: '$CHCT2_TEMP_RTD_02_AI',
          CHCT2_cold: '$CHCT2_TEMP_RTD_01_AI',
          CHCT2_speed: '$CHCT2_INV_01_SPD_AI',
          CT1_flow: '$CT1_FM_02_FR',
          CT1_hot: '$CT1_TEMP_RTD_02_AI',
          CT1_cold: '$CT1_TEMP_RTD_01_AI',
          CT1_speed: '$CT1_INV_01_SPD_AI',
          CT2_flow: '$CT2_FM_02_FR',
          CT2_hot: '$CT2_TEMP_RTD_02_AI',
          CT2_cold: '$CT2_TEMP_RTD_01_AI',
          CT2_speed: '$CT2_INV_01_SPD_AI',
        },
      },
      {
        $addFields: {
          CHCT1_heat: {
            $multiply: [
              1000,
              4.186,
              '$CHCT1_flow',
              { $subtract: ['$CHCT1_hot', '$CHCT1_cold'] },
            ],
          },
          CHCT2_heat: {
            $multiply: [
              1000,
              4.186,
              '$CHCT2_flow',
              { $subtract: ['$CHCT2_hot', '$CHCT2_cold'] },
            ],
          },
          CT1_heat: {
            $multiply: [
              1000,
              4.186,
              '$CT1_flow',
              { $subtract: ['$CT1_hot', '$CT1_cold'] },
            ],
          },
          CT2_heat: {
            $multiply: [
              1000,
              4.186,
              '$CT2_flow',
              { $subtract: ['$CT2_hot', '$CT2_cold'] },
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$timestamp' } },
          heat_CHCT: { $avg: { $add: ['$CHCT1_heat', '$CHCT2_heat'] } },
          heat_CT: { $avg: { $add: ['$CT1_heat', '$CT2_heat'] } },
          speed_CHCT: { $avg: { $avg: ['$CHCT1_speed', '$CHCT2_speed'] } },
          speed_CT: { $avg: { $avg: ['$CT1_speed', '$CT2_speed'] } },
        },
      },
      {
        $project: {
          label: '$_id',
          heatRejectionRate: {
            $switch: {
              branches: [
                { case: { $eq: [dto.towerType, 'CHCT'] }, then: '$heat_CHCT' },
                { case: { $eq: [dto.towerType, 'CT'] }, then: '$heat_CT' },
              ],
              default: { $add: ['$heat_CHCT', '$heat_CT'] },
            },
          },
          towerUtilization: {
            $switch: {
              branches: [
                { case: { $eq: [dto.towerType, 'CHCT'] }, then: '$speed_CHCT' },
                { case: { $eq: [dto.towerType, 'CT'] }, then: '$speed_CT' },
              ],
              default: { $avg: ['$speed_CHCT', '$speed_CT'] },
            },
          },
        },
      },
      { $sort: { label: 1 } },
    ];

    const result = await this.DashboardModel.aggregate(pipeline);

    const heatRejectionRate = result.map((r) => ({
      label: r.label,
      value: r.heatRejectionRate ? +r.heatRejectionRate.toFixed(2) : 0,
    }));

    const towerUtilizationRate = {
      grouped: result.map((r) => ({
        label: r.label,
        value: r.towerUtilization ? +r.towerUtilization.toFixed(2) : 0,
      })),
      overallAverage:
        result.length > 0
          ? +(
              result.reduce((sum, r) => sum + (r.towerUtilization || 0), 0) /
              result.length
            ).toFixed(2)
          : 0,
    };

    return {
      message: 'Heat Rejection and Tower Utilization Rate',
      data: {
        heatRejectionRate,
        towerUtilizationRate,
      },
    };
  }

  async getDashboardDataChart9(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const rangeProcessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    const fanSpeedProcessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        range: rangeProcessed,
        fanSpeed: fanSpeedProcessed,
      },
    };
  }

  async getDashboardDataChart10(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

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

    return {
      message: 'Dashboard Data',
      data: {
        approach: approachProcessed,
        coolingefficiency: efficiencyProcessed,
      },
    };
  }

  async getDashboardDataChart11(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const fanPowerConsumption = TowerDataProcessor.calculateFanPowerConsumption(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const fanEfficiency = TowerDataProcessor.calculateFanEfficiencyIndex(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    return {
      message: 'Dashboard Data',
      data: {
        fanPower: fanPowerConsumption,
        fanEfficiencyIndex: fanEfficiency,
      },
    };
  }

  async getDashboardDataChart12(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const driftLossRate = TowerDataProcessor.calculateDriftLossRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const evaporationLossRate = TowerDataProcessor.calculateEvaporationLossRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    const blowdownData = TowerDataProcessor.calculateBlowdownRate(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );
    // const makeupWaterData = TowerDataProcessor.calculateMakeupWater(
    //   data,
    //   dto.towerType || 'all',
    //   groupBy,
    //   startDate,
    //   endDate,
    // );
    // const coolingCapacity = TowerDataProcessor.calculateCoolingCapacity(
    //   data,
    //   dto.towerType || 'all',
    //   groupBy,
    //   startDate,
    //   endDate,
    // );
    const waterEfficiency = TowerDataProcessor.calculateWaterEfficiencyIndex(
      data,
      dto.towerType || 'all',
      groupBy,
      startDate,
      endDate,
    );

    return {
      message: 'Dashboard Data',
      data: {
        driftLossRate: driftLossRate,
        evaporationLossRate: evaporationLossRate,
        blowDownRate: blowdownData,
        // makeupWater: makeupWaterData,
        // coolingCapacity: coolingCapacity,
        waterEfficiency: waterEfficiency,
      },
    };
  }

  async getDashboardDataChart13(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();
    // const NormalisedWaterUsage =
    //   TowerDataProcessor.calculateNormalisedWaterUsage(
    //     data,
    //     dto.towerType || 'all',
    //     groupBy,
    //     startDate,
    //     endDate,
    //   );
    const DriftToEvaporationRatio =
      TowerDataProcessor.calculateDriftToEvapRatio(
        data,
        dto.towerType || 'all',
        groupBy,
        startDate,
        endDate,
      );
    return {
      message: 'Dashboard Data',
      data: {
        // NormalisedWaterUsage: NormalisedWaterUsage,
        DriftToEvaporationRatio: DriftToEvaporationRatio,
      },
    };
  }
  async getDashboardDataChart14(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    const wetBulb = 25;
    const coolingEfficiencyByTower =
      TowerDataProcessor.calculateCoolingEfficiencyByTower(data, wetBulb);
    return {
      message: 'Dashboard Data',
      data: {
        CoolingEfficiecnyByTower: coolingEfficiencyByTower,
      },
    };
  }
  async getDashboardDataChart15(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    // Determine breakdown type based on range
    let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.range) {
      if (dto.range === 'today' || dto.range === "yesterday") breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    const { overall, breakdown } = TowerDataProcessor.calculateRangeByTower(
      data,
      breakdownType,
    );

    return {
      message: 'Dashboard Data',
      data: {
        overall,
        breakdown,
      },
    };
  }
  async getDashboardDataChart16(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    // Determine breakdown type based on range
    let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.range) {
      if (dto.range === 'today' || dto.range === 'yesterday')
        breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    const wetBulb = 25; // Could be made configurable if needed
    const intervalApproach =
      TowerDataProcessor.calculateAverageApproachByInterval(
        data,
        wetBulb,
        breakdownType,
        dto.towerType || 'all',
      );

    const coolingEffectiveness =
      TowerDataProcessor.calculateCoolingEffectivenessByInterval(
        data,
        wetBulb,
        breakdownType,
        dto.towerType || 'all',
      );
    return {
      message: 'Dashboard Data',
      data: {
        Approach: intervalApproach,
        coolingTowerEffectiveness: coolingEffectiveness,
      },
    };
  }
  async getDashboardDataChart17(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    // Determine breakdown type based on range
    let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.range) {
      if (dto.range === 'today' || dto.range === 'yesterday')
        breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    const waterMetrics = TowerDataProcessor.calculateWaterMetricsByTower(
      data,
      breakdownType,
    );

    return {
      message: 'Dashboard Data',
      data: waterMetrics,
    };
  }
  async getDashboardDataChart18(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    // Determine breakdown type based on range
    let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.range) {
      if (dto.range === 'today' || dto.range === 'yesterday')
        breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    const wetBulb = 25; // or make it dynamic if needed
    const towers =
      dto.towerType === 'CHCT'
        ? ['CHCT1', 'CHCT2']
        : dto.towerType === 'CT'
          ? ['CT1', 'CT2']
          : ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    const coolingCapacityByTower =
      TowerDataProcessor.calculateCoolingCapacityByTower(
        data,
        breakdownType,
        towers,
      );

    const coolingEfficiencyByTower =
      TowerDataProcessor.calculateCoolingEfficiencyByTowerInCoolingCapacity(
        data,
        wetBulb,
        breakdownType,
        towers,
      );

    return {
      message: 'Dashboard Data',
      data: {
        coolingCapacity: coolingCapacityByTower,
        coolingEfficiency: coolingEfficiencyByTower,
      },
    };
  }
  async getDashboardDataChart19(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
  }) {
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

    const data = await this.DashboardModel.find(query).lean();

    // Determine breakdown type based on range
    let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.range) {
      if (dto.range === 'today' || dto.range === 'yesterday')
        breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    const fanPowerByTower = TowerDataProcessor.calculateFanPowerByTower(
      data,
      breakdownType,
      dto.towerType || 'all',
    );
    const fanEnergyEfficiencyIndex =
      TowerDataProcessor.calculateFanEnergyEfficiencyIndex(
        data,
        breakdownType,
        dto.towerType || 'all', // ['CHCT1', 'CHCT2'] | ['CT1', 'CT2'] | all
      );
    return {
      message: 'Dashboard Data',
      fanPower: fanPowerByTower,
      fanEnergyEfficiencyIndex: fanEnergyEfficiencyIndex,
    };
  }
}
