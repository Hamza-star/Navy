/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-case-declarations */
// dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardData } from './schemas/dashboard.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
import { TowerDataProcessor } from 'src/helpers/towerdataformulating-utils';
// For TypeScript + NestJS
import * as moment from 'moment-timezone';

import { format, format as formatDate, getWeek, getYear } from 'date-fns';
import { RangeService } from 'src/helpers/tower-metrics.service';
import { MongoService } from 'src/helpers/mongo.data.filter.service';
// import { TowerMetricsService } from 'src/helpers/tower-metrics.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('DashboardData')
    private readonly DashboardModel: Model<DashboardData>,
    private readonly mongoDateFilter: MongoDateFilterService,
    private readonly mongoService: MongoService,
    private readonly rangeService: RangeService, // <-- inject here
  ) {}

  async getDashboardDataChart1(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter (Asia/Karachi)
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range → daily grouping
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    if (!data.length) {
      return {
        message: 'Dashboard Data',
        data: {
          message: 'No Data Found for the selected filters',
          data: {},
        },
      };
    }

    // ------------------------------
    // 5️⃣ Calculate All Metrics
    // ------------------------------
    const range = RangeService.calculateRange(data, towerType, breakdownType);
    const approach = RangeService.calculateApproach(
      data,
      towerType,
      breakdownType,
    );
    const efficiency = RangeService.calculateCoolingEfficiency(
      data,
      towerType,
      breakdownType,
    );
    const capacity = RangeService.calculateCoolingCapacity(
      data,
      towerType,
      breakdownType,
    );
    const waterEfficiency = RangeService.calculateWaterEfficiencyIndex(
      data,
      towerType,
      breakdownType,
    );
    const waterConsumption = RangeService.calculateWaterConsumption(
      data,
      towerType,
      breakdownType,
    );
    const energy = RangeService.calculateAverageEnergyUsage(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // 6️⃣ Unified Nested Response (Chart7-style)
    // ------------------------------
    return {
      message: 'Dashoard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          range,
          approach,
          coolingefficiency: efficiency,
          coolingCapacity: capacity,
          waterEfficiency,
          waterConsumption,
          energyUsage: energy,
        },
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

  // async getDashboardDataChart6(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT' | 'CT' | 'all';
  // }) {
  //   const query: any = {};
  //   let startDate: Date = new Date();
  //   let endDate: Date = new Date();

  //   if (dto.date) {
  //     query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     startDate = new Date(dto.date);
  //     endDate = new Date(dto.date);
  //   } else if (dto.range) {
  //     try {
  //       const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //       query.timestamp = rangeFilter;
  //       startDate = new Date(rangeFilter.$gte);
  //       endDate = new Date(rangeFilter.$lte);
  //     } catch (err) {
  //       console.error('\n[ERROR] Date range filter error:', err.message);
  //     }
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = new Date(dto.fromDate);
  //     endDate = new Date(dto.toDate);
  //     query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //       startDate,
  //       endDate,
  //     );
  //   }

  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(query, timeFilter);
  //   }

  //   const groupBy =
  //     dto.range === 'today' || dto.range === 'yesterday'
  //       ? 'hour'
  //       : dto.range === 'week' || dto.range === 'lastWeek'
  //         ? 'day'
  //         : dto.range === 'month' || dto.range === 'lastMonth'
  //           ? 'day'
  //           : dto.range === 'year' || dto.range === 'lastYear'
  //             ? 'month'
  //             : 'day';

  //   const data = await this.DashboardModel.find(query).lean();

  //   const fanPowerConsumption = TowerDataProcessor.calculateFanPowerConsumption(
  //     data,
  //     dto.towerType || 'all',
  //     groupBy,
  //     startDate,
  //     endDate,
  //   );
  //   const fanEfficiency = TowerDataProcessor.calculateFanEfficiencyIndex(
  //     data,
  //     dto.towerType || 'all',
  //     groupBy,
  //     startDate,
  //     endDate,
  //   );
  //   return {
  //     message: 'Dashboard Data',
  //     data: {
  //       fanPower: fanPowerConsumption,
  //       fanEfficiencyIndex: fanEfficiency,
  //     },
  //   };
  // }

  async getDashboardDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
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
        console.error(
          '\n[ERROR] Date range filter error:',
          (err as Error).message,
        );
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

  // async getDashboardDataChart7(dto: {
  //   fromDate?: string;
  //   toDate?: string;
  //   date?: string;
  //   range?:
  //     | 'today'
  //     | 'yesterday'
  //     | 'week'
  //     | 'lastWeek'
  //     | 'month'
  //     | 'lastMonth'
  //     | 'year'
  //     | 'lastYear';
  //   interval?: '15min' | 'hour' | 'day' | 'month';
  //   towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
  //   startTime?: string;
  //   endTime?: string;
  // }) {
  //   const towerType = dto.towerType || 'all';

  //   // ------------------------------
  //   // 1️⃣ Determine date range (6AM-6AM)
  //   // ------------------------------
  //   let dateFilter: any;

  //   if (dto.fromDate && dto.toDate) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(
  //       new Date(dto.fromDate),
  //       new Date(dto.toDate),
  //     );
  //   } else if (dto.date) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(new Date(dto.date));
  //   } else if (dto.range) {
  //     dateFilter = this.mongoService.get6AMDateRange(dto.range);
  //   } else {
  //     dateFilter = this.mongoService.get6AMDateRange('today');
  //   }

  //   // ------------------------------
  //   // 2️⃣ Smart interval logic
  //   // ------------------------------
  //   let interval: '15min' | 'hour' | 'day' | 'month' = 'hour';

  //   switch (dto.range) {
  //     case 'today':
  //     case 'yesterday':
  //       // ✅ Use whatever user sends (hour, 15min, etc.)
  //       interval = dto.interval || 'hour';
  //       break;

  //     case 'week':
  //     case 'lastWeek':
  //     case 'month':
  //     case 'lastMonth':
  //       // ✅ Always group by day (ignore user interval)
  //       interval = 'day';
  //       break;

  //     case 'year':
  //     case 'lastYear':
  //       // ✅ Always group by month
  //       interval = 'month';
  //       break;

  //     default:
  //       interval = dto.interval || 'hour';
  //   }

  //   // ------------------------------
  //   // 3️⃣ Build Mongo query
  //   // ------------------------------
  //   const query: any = { timestamp: dateFilter };

  //   if (dto.startTime && dto.endTime) {
  //     Object.assign(
  //       query,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );
  //   }

  //   // ------------------------------
  //   // 4️⃣ Fetch data
  //   // ------------------------------
  //   const data = await this.DashboardModel.find(query).lean();

  //   // ------------------------------
  //   // 5️⃣ Compute metrics
  //   // ------------------------------
  //   const range = RangeService.calculateRange(data, towerType, interval);
  //   const approach = RangeService.calculateApproach(data, towerType, interval);
  //   const capacity = RangeService.calculateCoolingCapacity(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   // ------------------------------
  //   // 6️⃣ Return response
  //   // ------------------------------
  //   return {
  //     message: 'Dashboard Data',
  //     data: {
  //       message: 'Dashboard Data',
  //       data: {
  //         range,
  //         approach,
  //         coolingCapacity: capacity,
  //       },
  //     },
  //   };
  // }

  async getDashboardDataChart7(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM date range
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom range (6AM → 6AM)
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional time filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart interval (breakdown)
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range always by day
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Compute KPIs
    // ------------------------------
    const range = RangeService.calculateRange(data, towerType, breakdownType);
    const approach = RangeService.calculateApproach(
      data,
      towerType,
      breakdownType,
    );
    const capacity = RangeService.calculateCoolingCapacity(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // Final Response (Same Format)
    // ------------------------------
    return {
      message: 'Dashoard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          range,
          approach,
          coolingCapacity: capacity,
        },
      },
    };
  }

  // async getDashboardDataChart8(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   interval?: '15min' | 'hour' | 'day' | 'month';
  //   towerType?: 'CHCT' | 'CT' | 'all' | 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   startTime?: string;
  //   endTime?: string;
  // }) {
  //   // --------------------------------------
  //   // 🌍 Determine interval (auto adjusted)
  //   // --------------------------------------
  //   let interval: '15min' | 'hour' | 'day' | 'month' | string =
  //     dto.interval || 'hour';

  //   // 🔹 For custom range or long range → force day-wise aggregation
  //   if (
  //     dto.fromDate ||
  //     dto.toDate ||
  //     ['week', 'lastWeek', 'month', 'lastMonth', 'year', 'lastYear'].includes(
  //       dto.range || '',
  //     )
  //   ) {
  //     interval = 'day';
  //   } else if (['today', 'yesterday'].includes(dto.range || '')) {
  //     interval = 'hour';
  //   } else {
  //     interval = 'day';
  //   }

  //   // --------------------------------------
  //   // 🕕 6 AM → 6 AM Date handling (Karachi)
  //   // --------------------------------------
  //   let startDate: Date;
  //   let endDate: Date;

  //   if (dto.fromDate && dto.toDate) {
  //     startDate = moment
  //       .tz(dto.fromDate, 'Asia/Karachi')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //     endDate = moment
  //       .tz(dto.toDate, 'Asia/Karachi')
  //       .add(1, 'day')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //   } else if (dto.date) {
  //     startDate = moment
  //       .tz(dto.date, 'Asia/Karachi')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //     endDate = moment(startDate).add(1, 'day').toDate();
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = moment
  //       .tz(dateRange.$gte, 'Asia/Karachi')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //     endDate = moment
  //       .tz(dateRange.$lte, 'Asia/Karachi')
  //       .add(1, 'day')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //   } else {
  //     throw new Error('Date or range is required');
  //   }

  //   // --------------------------------------
  //   // 🧾 Mongo Aggregation
  //   // --------------------------------------
  //   let groupByFormat = '%Y-%m-%d %H:00';
  //   if (interval === '15min') groupByFormat = '%Y-%m-%d %H:%M';
  //   else if (interval === 'day') groupByFormat = '%Y-%m-%d';
  //   else if (interval === 'month') groupByFormat = '%Y-%m';

  //   const pipeline: any[] = [
  //     { $addFields: { parsedTimestamp: { $toDate: '$timestamp' } } },
  //     { $match: { parsedTimestamp: { $gte: startDate, $lt: endDate } } },
  //     {
  //       $project: {
  //         timestamp: '$parsedTimestamp',
  //         CHCT1_flow: '$CHCT1_FM_02_FR',
  //         CHCT1_hot: '$CHCT1_TEMP_RTD_02_AI',
  //         CHCT1_cold: '$CHCT1_TEMP_RTD_01_AI',
  //         CHCT1_speed: '$CHCT1_INV_01_SPD_AI',
  //         CHCT2_flow: '$CHCT2_FM_02_FR',
  //         CHCT2_hot: '$CHCT2_TEMP_RTD_02_AI',
  //         CHCT2_cold: '$CHCT2_TEMP_RTD_01_AI',
  //         CHCT2_speed: '$CHCT2_INV_01_SPD_AI',
  //         CT1_flow: '$CT1_FM_02_FR',
  //         CT1_hot: '$CT1_TEMP_RTD_02_AI',
  //         CT1_cold: '$CT1_TEMP_RTD_01_AI',
  //         CT1_speed: '$CT1_INV_01_SPD_AI',
  //         CT2_flow: '$CT2_FM_02_FR',
  //         CT2_hot: '$CT2_TEMP_RTD_02_AI',
  //         CT2_cold: '$CT2_TEMP_RTD_01_AI',
  //         CT2_speed: '$CT2_INV_01_SPD_AI',
  //       },
  //     },
  //     {
  //       $addFields: {
  //         CHCT1_heat: {
  //           $multiply: [
  //             1000,
  //             4.186,
  //             '$CHCT1_flow',
  //             { $subtract: ['$CHCT1_hot', '$CHCT1_cold'] },
  //           ],
  //         },
  //         CHCT2_heat: {
  //           $multiply: [
  //             1000,
  //             4.186,
  //             '$CHCT2_flow',
  //             { $subtract: ['$CHCT2_hot', '$CHCT2_cold'] },
  //           ],
  //         },
  //         CT1_heat: {
  //           $multiply: [
  //             1000,
  //             4.186,
  //             '$CT1_flow',
  //             { $subtract: ['$CT1_hot', '$CT1_cold'] },
  //           ],
  //         },
  //         CT2_heat: {
  //           $multiply: [
  //             1000,
  //             4.186,
  //             '$CT2_flow',
  //             { $subtract: ['$CT2_hot', '$CT2_cold'] },
  //           ],
  //         },
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: {
  //           $dateToString: {
  //             format: groupByFormat,
  //             date: '$timestamp',
  //             timezone: 'Asia/Karachi',
  //           },
  //         },
  //         heat_CHCT: { $avg: { $add: ['$CHCT1_heat', '$CHCT2_heat'] } },
  //         heat_CT: { $avg: { $add: ['$CT1_heat', '$CT2_heat'] } },
  //         speed_CHCT: { $avg: { $avg: ['$CHCT1_speed', '$CHCT2_speed'] } },
  //         speed_CT: { $avg: { $avg: ['$CT1_speed', '$CT2_speed'] } },
  //       },
  //     },
  //     {
  //       $project: {
  //         label: '$_id',
  //         heatRejectionRate: {
  //           $switch: {
  //             branches: [
  //               { case: { $eq: [dto.towerType, 'CHCT'] }, then: '$heat_CHCT' },
  //               { case: { $eq: [dto.towerType, 'CT'] }, then: '$heat_CT' },
  //             ],
  //             default: { $add: ['$heat_CHCT', '$heat_CT'] },
  //           },
  //         },
  //         towerUtilization: {
  //           $switch: {
  //             branches: [
  //               { case: { $eq: [dto.towerType, 'CHCT'] }, then: '$speed_CHCT' },
  //               { case: { $eq: [dto.towerType, 'CT'] }, then: '$speed_CT' },
  //             ],
  //             default: { $avg: ['$speed_CHCT', '$speed_CT'] },
  //           },
  //         },
  //       },
  //     },
  //     { $sort: { label: 1 } },
  //   ];

  //   const result = await this.DashboardModel.aggregate(pipeline);

  //   // --------------------------------------
  //   // 📊 Format Response
  //   // --------------------------------------
  //   const heatRejectionRate = {
  //     grouped: result.map((r) => ({
  //       label: r.label,
  //       value: +r.heatRejectionRate?.toFixed(2) || 0,
  //     })),
  //     overallAverage: +(
  //       result.reduce((sum, r) => sum + (r.heatRejectionRate || 0), 0) /
  //       (result.length || 1)
  //     ).toFixed(2),
  //   };

  //   const towerUtilizationRate = {
  //     grouped: result.map((r) => ({
  //       label: r.label,
  //       value: +r.towerUtilization?.toFixed(2) || 0,
  //     })),
  //     overallAverage: +(
  //       result.reduce((sum, r) => sum + (r.towerUtilization || 0), 0) /
  //       (result.length || 1)
  //     ).toFixed(2),
  //   };

  //   return {
  //     message: 'Heat Rejection and Tower Utilization Rate',
  //     intervalUsed: interval, // debug info
  //     data: {
  //       message: 'Heat Rejection and Tower Utilization Rate',
  //       data: { heatRejectRate: heatRejectionRate, towerUtilizationRate },
  //     },
  //   };
  // }

  async getDashboardDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    startTime?: string;
    endTime?: string;
  }) {
    // ------------------------
    // 🕕 6 AM → 6 AM Date handling (Karachi)
    // ------------------------
    let startDate: Date;
    let endDate: Date;

    if (dto.fromDate && dto.toDate) {
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
    } else if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment(startDate).add(1, 'day').toDate();
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = moment
        .tz(dateRange.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dateRange.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
    } else {
      throw new Error('Date or range is required');
    }

    // ------------------------
    // 🌟 Determine interval
    // ------------------------
    let interval: '15min' | 'hour' | 'day' | 'month';

    if (dto.range === 'today' || dto.range === 'yesterday') {
      // For single-day ranges, use user interval if provided
      interval = dto.interval || 'hour';
    } else if (
      dto.range &&
      ['week', 'lastWeek', 'month', 'lastMonth'].includes(dto.range)
    ) {
      interval = 'day';
    } else if (dto.range && ['year', 'lastYear'].includes(dto.range)) {
      interval = 'month';
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Ignore user interval for custom date range
      interval = 'day';
    } else {
      interval = 'hour';
    }

    // ------------------------
    // 🧾 Mongo Aggregation
    // ------------------------
    let groupByFormat = '%Y-%m-%d %H:00';
    if (interval === '15min') groupByFormat = '%Y-%m-%d %H:%M';
    else if (interval === 'day') groupByFormat = '%Y-%m-%d';
    else if (interval === 'month') groupByFormat = '%Y-%m';

    const pipeline: any[] = [
      { $addFields: { parsedTimestamp: { $toDate: '$timestamp' } } },
      { $match: { parsedTimestamp: { $gte: startDate, $lt: endDate } } },
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
          _id: {
            $dateToString: {
              format: groupByFormat,
              date: '$timestamp',
              timezone: 'Asia/Karachi',
            },
          },
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

    const heatRejectionRate = {
      grouped: result.map((r) => ({
        label: r.label,
        value: +r.heatRejectionRate?.toFixed(2) || 0,
      })),
      overallAverage: +(
        result.reduce((sum, r) => sum + (r.heatRejectionRate || 0), 0) /
        (result.length || 1)
      ).toFixed(2),
    };

    const towerUtilizationRate = {
      grouped: result.map((r) => ({
        label: r.label,
        value: +r.towerUtilization?.toFixed(2) || 0,
      })),
      overallAverage: +(
        result.reduce((sum, r) => sum + (r.towerUtilization || 0), 0) /
        (result.length || 1)
      ).toFixed(2),
    };

    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          heatRejectRate: heatRejectionRate,
          towerUtilizationRate,
        },
      },
    };
  }

  async getDashboardDataChart9(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom date range → 6AM to 6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Always daily for custom ranges
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Compute Metrics
    // ------------------------------
    const range = RangeService.calculateRange(data, towerType, breakdownType);
    const fanSpeed = RangeService.calculateFanSpeed(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // 6️⃣ Response (Chart1 / Chart7 Style)
    // ------------------------------
    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          range,
          fanSpeed,
        },
      },
    };
  }

  // async getDashboardDataChart10(dto: {
  //   fromDate?: string;
  //   toDate?: string;
  //   date?: string;
  //   range?:
  //     | 'today'
  //     | 'yesterday'
  //     | 'week'
  //     | 'lastWeek'
  //     | 'month'
  //     | 'lastMonth'
  //     | 'year'
  //     | 'lastYear';
  //   interval?: '15min' | 'hour' | 'day' | 'month';
  //   towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
  //   startTime?: string;
  //   endTime?: string;
  // }) {
  //   const towerType = dto.towerType || 'all';

  //   // ✅ Interval logic same as Chart1
  //   let interval: '15min' | 'hour' | 'day' | 'month';
  //   switch (dto.range) {
  //     case 'today':
  //     case 'yesterday':
  //       interval = 'hour';
  //       break;
  //     case 'week':
  //     case 'lastWeek':
  //     case 'month':
  //     case 'lastMonth':
  //       interval = 'day';
  //       break;
  //     case 'year':
  //     case 'lastYear':
  //       interval = 'month';
  //       break;
  //     default:
  //       interval = dto.interval || 'hour';
  //       break;
  //   }

  //   // ✅ 6 AM → 6 AM Date Filter (same as Chart1)
  //   let dateFilter: any;
  //   if (dto.fromDate && dto.toDate) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(
  //       new Date(dto.fromDate),
  //       new Date(dto.toDate),
  //     );
  //   } else if (dto.date) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(new Date(dto.date));
  //   } else if (dto.range) {
  //     dateFilter = this.mongoService.get6AMDateRange(dto.range);
  //   } else {
  //     dateFilter = this.mongoService.get6AMDateRange('today');
  //   }

  //   // ✅ Mongo query build
  //   const query: any = { timestamp: dateFilter };

  //   if (dto.startTime && dto.endTime) {
  //     Object.assign(
  //       query,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );
  //   }

  //   // ✅ Fetch data
  //   const data = await this.DashboardModel.find(query).lean();

  //   // ✅ Static wet-bulb (or dynamic later if needed)
  //   const wetBulb = 25;

  //   // ✅ Use RangeService (same logic as other metrics)
  //   const approachProcessed = RangeService.calculateApproach(
  //     data,
  //     towerType,
  //     interval,
  //     wetBulb,
  //   );

  //   const efficiencyProcessed = RangeService.calculateCoolingEfficiency(
  //     data,
  //     towerType,
  //     interval,
  //     wetBulb,
  //   );

  //   // ✅ Final response
  //   return {
  //     message: 'Dashboard Data',
  //     data: {
  //       approach: approachProcessed,
  //       coolingefficiency: efficiencyProcessed,
  //     },
  //   };
  // }

  async getDashboardDataChart10(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom date range → 6AM to 6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range → daily
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Calculate Metrics
    // ------------------------------
    const wetBulb = 25; // ✅ static or later make dynamic

    const approach = RangeService.calculateApproach(
      data,
      towerType,
      breakdownType,
      wetBulb,
    );
    const coolingEfficiency = RangeService.calculateCoolingEfficiency(
      data,
      towerType,
      breakdownType,
      wetBulb,
    );

    // ------------------------------
    // 6️⃣ Final Response (Chart7 Style)
    // ------------------------------
    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          approach,
          coolingefficiency: coolingEfficiency,
        },
      },
    };
  }

  async getDashboardDataChart11(dto: {
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    fromDate?: string;
    toDate?: string;
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom range → always 6AM–6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range → daily
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Calculate Metrics
    // ------------------------------
    const fanPower = RangeService.calculateFanPowerConsumption(
      data,
      towerType,
      breakdownType,
    );

    const fanEfficiencyIndex = RangeService.calculateFanEfficiencyIndex(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // 6️⃣ Final Response (Chart7 Style)
    // ------------------------------
    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          fanPower,
          fanEfficiencyIndex,
        },
      },
    };
  }

  // async getDashboardDataChart12(dto: {
  //   fromDate?: string;
  //   toDate?: string;
  //   date?: string;
  //   range?:
  //     | 'today'
  //     | 'yesterday'
  //     | 'week'
  //     | 'lastWeek'
  //     | 'month'
  //     | 'lastMonth'
  //     | 'year'
  //     | 'lastYear';
  //   interval?: '15min' | 'hour' | 'day' | 'month';
  //   towerType?: 'CHCT' | 'CT' | 'all' | 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   startTime?: string;
  //   endTime?: string;
  // }) {
  //   const towerType = dto.towerType || 'all';

  //   // ------------------------
  //   // Interval selection
  //   // ------------------------
  //   let interval: '15min' | 'hour' | 'day' | 'month' = dto.interval || 'hour';
  //   if (!dto.interval && dto.range) {
  //     switch (dto.range) {
  //       case 'today':
  //       case 'yesterday':
  //         interval = 'hour';
  //         break;
  //       case 'week':
  //       case 'lastWeek':
  //       case 'month':
  //       case 'lastMonth':
  //         interval = 'day';
  //         break;
  //       case 'year':
  //       case 'lastYear':
  //         interval = 'month';
  //         break;
  //     }
  //   }

  //   // ------------------------
  //   // 6 AM-based Date Filter
  //   // ------------------------
  //   let dateFilter: any;
  //   if (dto.fromDate && dto.toDate) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(
  //       new Date(dto.fromDate),
  //       new Date(dto.toDate),
  //     );
  //   } else if (dto.date) {
  //     dateFilter = this.mongoService.getCustom6AMDateRange(new Date(dto.date));
  //   } else if (dto.range) {
  //     dateFilter = this.mongoService.get6AMDateRange(dto.range);
  //   } else {
  //     dateFilter = this.mongoService.get6AMDateRange('today');
  //   }

  //   // ------------------------
  //   // Build Mongo Query
  //   // ------------------------
  //   const query: any = { timestamp: dateFilter };
  //   if (dto.startTime && dto.endTime) {
  //     Object.assign(
  //       query,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );
  //   }

  //   // ------------------------
  //   // Fetch Data
  //   // ------------------------
  //   const data = await this.DashboardModel.find(query).lean();

  //   // ------------------------
  //   // Calculate using RangeService
  //   // ------------------------
  //   const driftLossRate = RangeService.calculateDriftLossRate(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   const evaporationLossRate = RangeService.calculateEvaporationLossRate(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   const blowdownRate = RangeService.calculateBlowdownRate(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   const makeupWater = RangeService.calculateMakeupWater(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   const waterEfficiency = RangeService.calculateWaterEfficiencyIndex(
  //     data,
  //     towerType,
  //     interval,
  //   );

  //   // ------------------------
  //   // Return Response
  //   // ------------------------
  //   return {
  //     message: 'Dashboard Data',
  //     data: {
  //       driftLossRate,
  //       evaporationLossRate,
  //       blowdownRate,
  //       makeupWater,
  //       waterEfficiency,
  //     },
  //   };
  // }

  async getDashboardDataChart12(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom range → 6AM–6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range → daily grouping
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Calculate Metrics
    // ------------------------------
    const driftLossRate = RangeService.calculateDriftLossRate(
      data,
      towerType,
      breakdownType,
    );
    const evaporationLossRate = RangeService.calculateEvaporationLossRate(
      data,
      towerType,
      breakdownType,
    );
    const blowDownRate = RangeService.calculateBlowdownRate(
      data,
      towerType,
      breakdownType,
    );
    const makeupWater = RangeService.calculateMakeupWater(
      data,
      towerType,
      breakdownType,
    );
    const waterEfficiency = RangeService.calculateWaterEfficiencyIndex(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // 6️⃣ Final Response (Chart7 Style)
    // ------------------------------
    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          driftLossRate,
          evaporationLossRate,
          blowDownRate,
          makeupWater,
          waterEfficiency,
        },
      },
    };
  }

  async getDashboardDataChart13(dto: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    range?:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear';
    interval?: '15min' | 'hour' | 'day' | 'month';
    towerType?: 'CHCT' | 'CT' | 'all' | 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    startTime?: string;
    endTime?: string;
  }) {
    const towerType = dto.towerType || 'all';
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ------------------------------
    // 1️⃣ Build 6AM–6AM Date Filter (Asia/Karachi)
    // ------------------------------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.fromDate && dto.toDate) {
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else {
      const rangeFilter = this.mongoDateFilter.getDateRangeFilter('today');
      startDate = moment
        .tz(rangeFilter.$gte, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(rangeFilter.$lte, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ------------------------------
    // 2️⃣ Optional Time Filter
    // ------------------------------
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // ------------------------------
    // 3️⃣ Smart Interval Logic
    // ------------------------------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' = 'hour';

    if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = dto.interval || 'hour';
          break;
        case 'week':
        case 'lastWeek':
        case 'month':
        case 'lastMonth':
          breakdownType = 'day';
          break;
        case 'year':
        case 'lastYear':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      breakdownType = 'day'; // ✅ Custom range → daily grouping
    } else if (dto.interval) {
      breakdownType = dto.interval;
    }

    // ------------------------------
    // 4️⃣ Fetch Data
    // ------------------------------
    const data = await this.DashboardModel.find(query).lean();

    // ------------------------------
    // 5️⃣ Calculate Drift-to-Evaporation Ratio
    // ------------------------------
    const driftToEvap = RangeService.calculateDriftToEvapRatio(
      data,
      towerType,
      breakdownType,
    );

    // ------------------------------
    // 6️⃣ Final Response (Chart7 Style)
    // ------------------------------
    return {
      message: 'Dashboard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          DriftToEvaporationRatio: driftToEvap,
        },
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

    // ---------- DATE RANGE HANDLING ----------
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

    // ---------- TIME RANGE ----------
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
    }

    // ---------- FETCH DATA ----------
    const data = await this.DashboardModel.find(query).lean();

    // ---------- PROCESS ----------
    const wetBulb = 25;
    const coolingEfficiencyByTower =
      TowerDataProcessor.calculateCoolingEfficiencyByTower(data, wetBulb);

    // ---------- FINAL RESPONSE (matches your target structure) ----------
    return {
      message: 'Dashboard Data',

      data: {
        CoolingEfficiecnyByTower: coolingEfficiencyByTower,
      },
    };
  }

  // async getDashboardDataChart15(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT' | 'CT' | 'all';
  // }) {
  //   const query: any = {};
  //   let startDate: Date = new Date();
  //   let endDate: Date = new Date();

  //   if (dto.date) {
  //     query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     startDate = new Date(dto.date);
  //     endDate = new Date(dto.date);
  //   } else if (dto.range) {
  //     try {
  //       const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //       query.timestamp = rangeFilter;
  //       startDate = new Date(rangeFilter.$gte);
  //       endDate = new Date(rangeFilter.$lte);
  //     } catch (err) {
  //       console.error('\n[ERROR] Date range filter error:', err.message);
  //     }
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = new Date(dto.fromDate);
  //     endDate = new Date(dto.toDate);
  //     query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //       startDate,
  //       endDate,
  //     );
  //   }

  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(query, timeFilter);
  //   }

  //   const data = await this.DashboardModel.find(query).lean();

  //   // Determine breakdown type based on range
  //   let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

  //   if (dto.range) {
  //     if (dto.range === 'today' || dto.range === 'yesterday')
  //       breakdownType = 'hour';
  //     else if (dto.range === 'week' || dto.range === 'month')
  //       breakdownType = 'day';
  //     else if (dto.range === 'year') breakdownType = 'month';
  //   } else if (dto.fromDate && dto.toDate) {
  //     const diffDays =
  //       (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  //     if (diffDays <= 1) breakdownType = 'hour';
  //     else if (diffDays <= 60) breakdownType = 'day';
  //     else breakdownType = 'month';
  //   }

  //   const { overall, breakdown } = TowerDataProcessor.calculateRangeByTower(
  //     data,
  //     breakdownType,
  //   );

  //   return {
  //     message: 'Dashboard Data',
  //     data: {
  //       overall,
  //       breakdown,
  //     },
  //   };
  // }

  async getDashboardDataChart15(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
    interval?: 'hour' | '15min' | 'day' | 'month';
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    if (dto.date) {
      // ✅ Karachi timezone 6:00AM → next day 6:00AM
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

        startDate = moment
          .tz(rangeFilter.$gte, 'Asia/Karachi')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();
        endDate = moment
          .tz(rangeFilter.$lte, 'Asia/Karachi')
          .add(1, 'day')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();

        query.timestamp = this.mongoDateFilter.getCustomDateRange(
          startDate,
          endDate,
        );
      } catch (err) {
        console.error('\n[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom date bhi Karachi time 6AM → next day 6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

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

    // ✅ Interval logic same as Chart17
    let breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none';

    if (dto.interval) {
      breakdownType = dto.interval;
    } else if (dto.range) {
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

    const { overall, breakdown } = TowerDataProcessor.calculateRangeByTower(
      data,
      breakdownType,
    );

    return {
      message: 'Dashboard Data',
      breakdownType,
      data: {
        overall,
        breakdown,
      },
      range: { startDate, endDate }, // ✅ debugging ke liye
    };
  }

  // async getDashboardDataChart16(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT' | 'CT' | 'all';
  // }) {
  //   const query: any = {};
  //   let startDate: Date = new Date();
  //   let endDate: Date = new Date();

  //   if (dto.date) {
  //     // Karachi timezone 6:00AM → next day 6:00AM
  //     startDate = moment
  //       .tz(dto.date, 'Asia/Karachi')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //     endDate = moment
  //       .tz(dto.date, 'Asia/Karachi')
  //       .add(1, 'day')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();

  //     query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //       startDate,
  //       endDate,
  //     );
  //   } else if (dto.range) {
  //     try {
  //       const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

  //       startDate = moment
  //         .tz(rangeFilter.$gte, 'Asia/Karachi')
  //         .hour(6)
  //         .minute(0)
  //         .second(0)
  //         .toDate();
  //       endDate = moment
  //         .tz(rangeFilter.$lte, 'Asia/Karachi')
  //         .add(1, 'day')
  //         .hour(6)
  //         .minute(0)
  //         .second(0)
  //         .toDate();

  //       query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //         startDate,
  //         endDate,
  //       );
  //     } catch (err) {
  //       console.error('\n[ERROR] Date range filter error:', err.message);
  //     }
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Custom date Karachi timezone 6AM → next day 6AM
  //     startDate = moment
  //       .tz(dto.fromDate, 'Asia/Karachi')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();
  //     endDate = moment
  //       .tz(dto.toDate, 'Asia/Karachi')
  //       .add(1, 'day')
  //       .hour(6)
  //       .minute(0)
  //       .second(0)
  //       .toDate();

  //     query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //       startDate,
  //       endDate,
  //     );
  //   }

  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(query, timeFilter);
  //   }

  //   const data = await this.DashboardModel.find(query).lean();

  //   // Determine breakdown type
  //   let breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none';

  //   if (dto.range) {
  //     if (dto.range === 'today' || dto.range === 'yesterday')
  //       breakdownType = 'hour';
  //     else if (dto.range === 'week' || dto.range === 'month')
  //       breakdownType = 'day';
  //     else if (dto.range === 'year') breakdownType = 'month';
  //   } else if (dto.fromDate && dto.toDate) {
  //     const diffDays =
  //       (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  //     if (diffDays <= 1) breakdownType = 'hour';
  //     else if (diffDays <= 60) breakdownType = 'day';
  //     else breakdownType = 'month';
  //   }

  //   const wetBulb = 25; // Configurable if needed

  //   const intervalApproach =
  //     TowerDataProcessor.calculateAverageApproachByInterval(
  //       data,
  //       wetBulb,
  //       breakdownType,
  //       dto.towerType || 'all',
  //     );

  //   const coolingEffectiveness =
  //     TowerDataProcessor.calculateCoolingEffectivenessByInterval(
  //       data,
  //       wetBulb,
  //       breakdownType,
  //       dto.towerType || 'all',
  //     );

  //   return {
  //     message: 'Dashboard Data',
  //     breakdownType,
  //     data: {
  //       Approach: intervalApproach,
  //       coolingTowerEffectiveness: coolingEffectiveness,
  //     },
  //     range: { startDate, endDate }, // For debugging
  //   };
  // }

  async getDashboardDataChart16(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
    interval?: '15min' | 'hour' | 'day' | 'month';
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ---------- DATE RANGE HANDLING ----------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
        startDate = moment
          .tz(rangeFilter.$gte, 'Asia/Karachi')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();
        endDate = moment
          .tz(rangeFilter.$lte, 'Asia/Karachi')
          .add(1, 'day')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();
        query.timestamp = this.mongoDateFilter.getCustomDateRange(
          startDate,
          endDate,
        );
      } catch (err) {
        console.error('[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ---------- TIME RANGE ----------
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
    }

    // ---------- FETCH DATA ----------
    const data = await this.DashboardModel.find(query).lean();

    // ---------- DETERMINE INTERVAL ----------
    let breakdownType: '15min' | 'hour' | 'day' | 'month' | 'none' = 'none';

    if (dto.interval) {
      breakdownType = dto.interval;
    } else if (dto.range) {
      if (dto.range === 'today' || dto.range === 'yesterday')
        breakdownType = 'hour';
      else if (dto.range === 'week' || dto.range === 'month')
        breakdownType = 'day';
      else if (dto.range === 'year') breakdownType = 'month';
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 0.5) breakdownType = '15min';
      else if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    // ---------- PROCESS DATA ----------
    const wetBulb = 25;
    const towerType = dto.towerType || 'all';

    const intervalApproach =
      TowerDataProcessor.calculateAverageApproachByInterval(
        data,
        wetBulb,
        breakdownType,
        towerType,
      );

    const coolingEffectiveness =
      TowerDataProcessor.calculateCoolingEffectivenessByInterval(
        data,
        wetBulb,
        breakdownType,
        towerType,
      );

    // ---------- FINAL RESPONSE (2 levels only) ----------
    return {
      message: 'Dashboard Data',
      data: {
        Approach: intervalApproach,
        coolingTowerEffectiveness: coolingEffectiveness,
      },
      breakdownType,
      range: { startDate, endDate },
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
    interval?: 'hour' | '15min';
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    if (dto.date) {
      // ✅ Karachi timezone 6:00AM → next day 6:00AM
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

        startDate = moment
          .tz(rangeFilter.$gte, 'Asia/Karachi')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();
        endDate = moment
          .tz(rangeFilter.$lte, 'Asia/Karachi')
          .add(1, 'day')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();

        query.timestamp = this.mongoDateFilter.getCustomDateRange(
          startDate,
          endDate,
        );
      } catch (err) {
        console.error('\n[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      // ✅ Custom date bhi Karachi time 6AM → next day 6AM
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

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

    // ✅ Interval logic
    let breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none';

    if (dto.interval) {
      breakdownType = dto.interval;
    } else if (dto.range) {
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
      breakdownType,
      data: waterMetrics,
      range: { startDate, endDate }, // ✅ Debugging ke liye
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
    interval?: '15min' | 'hour' | 'day' | 'month';
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    // ---------- Date Handling (Karachi Time 6AM → next day 6AM) ----------
    if (dto.date) {
      startDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.date, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);

        startDate = moment
          .tz(rangeFilter.$gte, 'Asia/Karachi')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();
        endDate = moment
          .tz(rangeFilter.$lte, 'Asia/Karachi')
          .add(1, 'day')
          .hour(6)
          .minute(0)
          .second(0)
          .toDate();

        query.timestamp = this.mongoDateFilter.getCustomDateRange(
          startDate,
          endDate,
        );
      } catch (err) {
        console.error('\n[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      startDate = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();
      endDate = moment
        .tz(dto.toDate, 'Asia/Karachi')
        .add(1, 'day')
        .hour(6)
        .minute(0)
        .second(0)
        .toDate();

      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ---------- Time Filter ----------
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
    }

    // ---------- Fetch Data ----------
    const data = await this.DashboardModel.find(query).lean();

    // ---------- Determine Breakdown Type ----------
    type ValidBreakdown = '15min' | 'hour' | 'day' | 'month' | 'none';
    let breakdownType: ValidBreakdown = 'none';

    if (dto.interval) {
      breakdownType = dto.interval;
    } else if (dto.range) {
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

    // ---------- Tower Selection ----------
    const wetBulb = 25;
    const towers =
      dto.towerType === 'CHCT'
        ? ['CHCT1', 'CHCT2']
        : dto.towerType === 'CT'
          ? ['CT1', 'CT2']
          : ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    // ---------- Call Processors ----------
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

    // ---------- Response (With Nested Data Layer) ----------
    return {
      message: 'Dashoard Data',
      data: {
        message: 'Dashboard Data',
        data: {
          coolingCapacity: coolingCapacityByTower,
          coolingEfficiency: coolingEfficiencyByTower,
        },
      },
      breakdownType,
      range: { startDate, endDate }, // optional
    };
  }

  // async getDashboardDataChart19(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT' | 'CT' | 'all';
  // }) {
  //   const query: any = {};
  //   let startDate: Date = new Date();
  //   let endDate: Date = new Date();

  //   if (dto.date) {
  //     query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     startDate = new Date(dto.date);
  //     endDate = new Date(dto.date);
  //   } else if (dto.range) {
  //     try {
  //       const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //       query.timestamp = rangeFilter;
  //       startDate = new Date(rangeFilter.$gte);
  //       endDate = new Date(rangeFilter.$lte);
  //     } catch (err) {
  //       console.error('\n[ERROR] Date range filter error:', err.message);
  //     }
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = new Date(dto.fromDate);
  //     endDate = new Date(dto.toDate);
  //     query.timestamp = this.mongoDateFilter.getCustomDateRange(
  //       startDate,
  //       endDate,
  //     );
  //   }

  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(query, timeFilter);
  //   }

  //   const data = await this.DashboardModel.find(query).lean();

  //   // Determine breakdown type based on range
  //   let breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none';

  //   if (dto.range) {
  //     if (dto.range === 'today' || dto.range === 'yesterday')
  //       breakdownType = 'hour';
  //     else if (dto.range === 'week' || dto.range === 'month')
  //       breakdownType = 'day';
  //     else if (dto.range === 'year') breakdownType = 'month';
  //   } else if (dto.fromDate && dto.toDate) {
  //     const diffDays =
  //       (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  //     if (diffDays <= 1) breakdownType = 'hour';
  //     else if (diffDays <= 60) breakdownType = 'day';
  //     else breakdownType = 'month';
  //   }

  //   const fanPowerByTower = TowerDataProcessor.calculateFanPowerByTower(
  //     data,
  //     breakdownType,
  //     dto.towerType || 'all',
  //   );
  //   const fanEnergyEfficiencyIndex =
  //     TowerDataProcessor.calculateFanEnergyEfficiencyIndex(
  //       data,
  //       breakdownType,
  //       dto.towerType || 'all', // ['CHCT1', 'CHCT2'] | ['CT1', 'CT2'] | all
  //     );
  //   return {
  //     message: 'Dashboard Data',
  //     fanPower: fanPowerByTower,
  //     fanEnergyEfficiencyIndex: fanEnergyEfficiencyIndex,
  //   };
  // }

  async getDashboardDataChart19(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
    interval?: 'hour' | '15min';
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    const setKarachi6AM = (
      dateStr: string | Date,
      addNextDay: boolean = false,
    ) => {
      let m = moment.tz(dateStr, 'Asia/Karachi').hour(6).minute(0).second(0);
      if (addNextDay) m = m.add(1, 'day');
      return m.toDate();
    };

    // ✅ Date / Range handling
    if (dto.date) {
      startDate = setKarachi6AM(dto.date);
      endDate = setKarachi6AM(dto.date, true);
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    } else if (dto.range) {
      try {
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
        startDate = setKarachi6AM(rangeFilter.$gte);
        endDate = setKarachi6AM(rangeFilter.$lte, true);
        query.timestamp = this.mongoDateFilter.getCustomDateRange(
          startDate,
          endDate,
        );
      } catch (err) {
        console.error('[ERROR] Date range filter error:', err.message);
      }
    } else if (dto.fromDate && dto.toDate) {
      startDate = setKarachi6AM(dto.fromDate);
      endDate = setKarachi6AM(dto.toDate, true);
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        startDate,
        endDate,
      );
    }

    // ✅ Optional time filter
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(query, timeFilter);
    }

    const data = await this.DashboardModel.find(query).lean();

    // ✅ Determine breakdownType
    let breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none';

    if (dto.interval) breakdownType = dto.interval;
    else if (dto.range) {
      switch (dto.range) {
        case 'today':
        case 'yesterday':
          breakdownType = 'hour';
          break;
        case 'week':
        case 'month':
          breakdownType = 'day';
          break;
        case 'year':
          breakdownType = 'month';
          break;
      }
    } else if (dto.fromDate && dto.toDate) {
      const diffDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) breakdownType = 'hour';
      else if (diffDays <= 60) breakdownType = 'day';
      else breakdownType = 'month';
    }

    // ✅ Process data
    const fanPowerByTower = TowerDataProcessor.calculateFanPowerByTower(
      data,
      breakdownType,
      dto.towerType || 'all',
    );

    const fanEnergyEfficiencyIndex =
      TowerDataProcessor.calculateFanEnergyEfficiencyIndex(
        data,
        breakdownType,
        dto.towerType || 'all',
      );

    // ✅ Response in your required format
    return {
      message: 'Dashoard Data',
      data: {
        message: 'Dashboard Data',
        fanPower: fanPowerByTower,
        fanEnergyEfficiencyIndex: fanEnergyEfficiencyIndex,
      },
      range: { startDate, endDate }, // Optional for debugging
    };
  }
}
