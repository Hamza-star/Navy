import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisData } from './schemas/analysis.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
import { DateTime } from 'luxon';
@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(AnalysisData.name)
    private readonly AnalysisModel: Model<AnalysisData>,
    private readonly mongoDateFilter: MongoDateFilterService,
  ) {}
  // async getAnalysisDataChart1(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   // --- Date Range Handling ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
  //       .setZone(tz)
  //       .endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     const day = DateTime.fromISO(dto.date, { zone: tz });
  //     startDate = day.startOf('day');
  //     endDate = day.endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Fetch only by timestamp string boundaries ---
  //   const filter: any = {
  //     timestamp: {
  //       $gte: startDate.toISO(),
  //       $lte: endDate.toISO(),
  //     },
  //   };

  //   if (dto.startTime && dto.endTime) {
  //     const custom = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, custom);
  //   }

  //   // --- Projection ---
  //   const projection: any = { _id: 1, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 1 Data', rawdata: [] };

  //   const towerPrefix = `${dto.towerType}_`;
  //   for (const field in sampleDoc) {
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;
  //   }

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   // --- Grouping ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';
  //   const wetBulb = 28;

  //   const groupMap = new Map<
  //     string,
  //     {
  //       efficiencySum: number;
  //       supplySum: number;
  //       returnSum: number;
  //       count: number;
  //     }
  //   >();

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     if (!groupMap.has(label)) {
  //       groupMap.set(label, {
  //         efficiencySum: 0,
  //         supplySum: 0,
  //         returnSum: 0,
  //         count: 0,
  //       });
  //     }

  //     const group = groupMap.get(label)!;
  //     const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //     const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];

  //     const eff =
  //       typeof hot === 'number' &&
  //       typeof cold === 'number' &&
  //       hot - wetBulb !== 0
  //         ? ((hot - cold) / (hot - wetBulb)) * 100
  //         : null;

  //     if (eff !== null) group.efficiencySum += eff;
  //     if (typeof hot === 'number') group.supplySum += hot;
  //     if (typeof cold === 'number') group.returnSum += cold;
  //     group.count++;
  //   }

  //   // --- Only actual groups (no empty buckets) ---
  //   const result = Array.from(groupMap.entries()).map(([label, group]) => ({
  //     label,
  //     coolingEfficiency:
  //       group.count > 0 ? group.efficiencySum / group.count : 0,
  //     supplyTemp: group.count > 0 ? group.supplySum / group.count : 0,
  //     returnTemp: group.count > 0 ? group.returnSum / group.count : 0,
  //     wetBulb,
  //   }));

  //   return { message: 'Analysis Chart 1 Data', rawdata: result };
  // }

  async getAnalysisDataChart1(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // NEW param
  }) {
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date Range Handling ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      const day = DateTime.fromISO(dto.date, { zone: tz });
      startDate = day.startOf('day');
      endDate = day.endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Fetch only by timestamp string boundaries ---
    const filter: any = {
      timestamp: {
        $gte: startDate.toISO(),
        $lte: endDate.toISO(),
      },
    };

    if (dto.startTime && dto.endTime) {
      const custom = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, custom);
    }

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 1 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) projection[field] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval Selection (auto mode) ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const wetBulb = 28;

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;

    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      {
        efficiencySum: number;
        supplySum: number;
        returnSum: number;
        count: number;
      }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          efficiencySum: 0,
          supplySum: 0,
          returnSum: 0,
          count: 0,
        });
      }

      const group = groupMap.get(label)!;
      const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
      const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];

      const eff =
        typeof hot === 'number' &&
        typeof cold === 'number' &&
        hot - wetBulb !== 0
          ? ((hot - cold) / (hot - wetBulb)) * 100
          : null;

      if (eff !== null) group.efficiencySum += eff;
      if (typeof hot === 'number') group.supplySum += hot;
      if (typeof cold === 'number') group.returnSum += cold;
      group.count++;
    }

    // --- Merge Buckets with Data ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        coolingEfficiency: count ? group!.efficiencySum / count : 0,
        supplyTemp: count ? group!.supplySum / count : 0,
        returnTemp: count ? group!.returnSum / count : 0,
        wetBulb,
      };
    });

    return { message: 'Analysis Chart 1 Data', rawdata: result };
  }

  // async getAnalysisDataChart2(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   wetBulb?: number;
  // }) {
  //   const tz = 'Asia/Karachi';
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
  //       .setZone(tz)
  //       .endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     const day = DateTime.fromISO(dto.date, { zone: tz });
  //     startDate = day.startOf('day');
  //     endDate = day.endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   const filter: any = {
  //     timestamp: {
  //       $gte: startDate.toISO(),
  //       $lte: endDate.toISO(),
  //     },
  //   };

  //   if (dto.startTime && dto.endTime) {
  //     const custom = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, custom);
  //   }

  //   const projection: any = { _id: 1, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 2 Data', rawdata: [] };

  //   const towerPrefix = `${dto.towerType}_`;
  //   for (const field in sampleDoc) {
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;
  //   }

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';
  //   const wetBulb = dto.wetBulb ?? 28;

  //   const groupMap = new Map<
  //     string,
  //     {
  //       approachSum: number;
  //       supplySum: number;
  //       returnSum: number;
  //       count: number;
  //     }
  //   >();

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     if (!groupMap.has(label)) {
  //       groupMap.set(label, {
  //         approachSum: 0,
  //         supplySum: 0,
  //         returnSum: 0,
  //         count: 0,
  //       });
  //     }

  //     const group = groupMap.get(label)!;
  //     const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //     const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];

  //     const approach =
  //       typeof returnTemp === 'number' ? returnTemp - wetBulb : null;

  //     if (approach !== null) group.approachSum += approach;
  //     if (typeof supplyTemp === 'number') group.supplySum += supplyTemp;
  //     if (typeof returnTemp === 'number') group.returnSum += returnTemp;
  //     group.count++;
  //   }

  //   const result = Array.from(groupMap.entries()).map(([label, group]) => ({
  //     label,
  //     approach: group.count > 0 ? group.approachSum / group.count : 0,
  //     supplyTemp: group.count > 0 ? group.supplySum / group.count : 0,
  //     returnTemp: group.count > 0 ? group.returnSum / group.count : 0,
  //     wetBulb,
  //   }));

  //   return { message: 'Analysis Chart 2 Data', rawdata: result };
  // }

  async getAnalysisDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    wetBulb?: number;
    interval?: '15min' | 'hour' | 'day'; // NEW param
  }) {
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date Range Handling ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      const day = DateTime.fromISO(dto.date, { zone: tz });
      startDate = day.startOf('day');
      endDate = day.endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    const filter: any = {
      timestamp: {
        $gte: startDate.toISO(),
        $lte: endDate.toISO(),
      },
    };

    if (dto.startTime && dto.endTime) {
      const custom = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, custom);
    }

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 2 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) projection[field] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval Selection (auto mode) ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const wetBulb = dto.wetBulb ?? 28;

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;

    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      {
        approachSum: number;
        supplySum: number;
        returnSum: number;
        count: number;
      }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          approachSum: 0,
          supplySum: 0,
          returnSum: 0,
          count: 0,
        });
      }

      const group = groupMap.get(label)!;
      const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
      const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];

      const approach =
        typeof returnTemp === 'number' ? returnTemp - wetBulb : null;

      if (approach !== null) group.approachSum += approach;
      if (typeof supplyTemp === 'number') group.supplySum += supplyTemp;
      if (typeof returnTemp === 'number') group.returnSum += returnTemp;
      group.count++;
    }

    // --- Merge Buckets with Data ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        approach: count ? group!.approachSum / count : 0,
        supplyTemp: count ? group!.supplySum / count : 0,
        returnTemp: count ? group!.returnSum / count : 0,
        wetBulb,
      };
    });

    return { message: 'Analysis Chart 2 Data', rawdata: result };
  }

  // async getAnalysisDataChart3(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date Filtering ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // ✅ Apply date filter on string timestamps (ISO format in DB)
  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Time filtering (if provided) ---
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // --- Projection ---
  //   const projection: any = { _id: 1, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) {
  //     return { message: 'Analysis Chart 3 Data', rawdata: [] };
  //   }

  //   const towerPrefix = `${dto.towerType}_`;
  //   for (const field in sampleDoc) {
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;
  //   }

  //   // --- Query ---
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';
  //   const Cp = 4.186;

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //     if (cursor > endDate) break; // ✅ safety
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<
  //     string,
  //     {
  //       capacitySum: number;
  //       supplySum: number;
  //       returnSum: number;
  //       count: number;
  //     }
  //   >();

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     if (!groupMap.has(label)) {
  //       groupMap.set(label, {
  //         capacitySum: 0,
  //         supplySum: 0,
  //         returnSum: 0,
  //         count: 0,
  //       });
  //     }

  //     const group = groupMap.get(label)!;
  //     const flow = doc[`${dto.towerType}_FM_02_FR`];
  //     const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //     const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];

  //     if (
  //       typeof flow === 'number' &&
  //       typeof returnTemp === 'number' &&
  //       typeof supplyTemp === 'number'
  //     ) {
  //       group.capacitySum += Cp * flow * (returnTemp - supplyTemp);
  //       group.supplySum += supplyTemp;
  //       group.returnSum += returnTemp;
  //       group.count++;
  //     }
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const group = groupMap.get(timestamp);
  //     const count = group?.count || 0;
  //     return {
  //       label: timestamp,
  //       coolingCapacity: count > 0 ? group!.capacitySum / count : 0,
  //       supplyTemp: count > 0 ? group!.supplySum / count : 0,
  //       returnTemp: count > 0 ? group!.returnSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 3 Data', rawdata: result };
  // }

  async getAnalysisDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added param
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date Filtering ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // ✅ Apply date filter
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Time filtering (if provided) ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 3 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) projection[field] = 1;
    }

    // --- Query ---
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval Selection (auto mode) ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const Cp = 4.186;

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;

    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      {
        capacitySum: number;
        supplySum: number;
        returnSum: number;
        count: number;
      }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          capacitySum: 0,
          supplySum: 0,
          returnSum: 0,
          count: 0,
        });
      }

      const group = groupMap.get(label)!;
      const flow = doc[`${dto.towerType}_FM_02_FR`];
      const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
      const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];

      if (
        typeof flow === 'number' &&
        typeof returnTemp === 'number' &&
        typeof supplyTemp === 'number'
      ) {
        group.capacitySum += Cp * flow * (returnTemp - supplyTemp);
        group.supplySum += supplyTemp;
        group.returnSum += returnTemp;
        group.count++;
      }
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        coolingCapacity: count > 0 ? group!.capacitySum / count : 0,
        supplyTemp: count > 0 ? group!.supplySum / count : 0,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 3 Data', rawdata: result };
  }

  // async getAnalysisDataChart4(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date range ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Time range ---
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // --- Add timestamp filter (IMPORTANT to avoid missing last bucket) ---
  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) {
  //     return { message: 'Analysis Chart 4 Data', rawdata: [] };
  //   }

  //   const towerPrefix = `${dto.towerType}_`;
  //   for (const field in sampleDoc) {
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;
  //   }

  //   // --- Fetch data ---
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<string, { returnSum: number; count: number }>();

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     if (!groupMap.has(label)) {
  //       groupMap.set(label, { returnSum: 0, count: 0 });
  //     }

  //     const group = groupMap.get(label)!;
  //     const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //     if (typeof cold === 'number') group.returnSum += cold;
  //     group.count++;
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const group = groupMap.get(timestamp);
  //     const count = group?.count || 0;
  //     return {
  //       label: timestamp,
  //       returnTemp: count > 0 ? group!.returnSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 4 Data', rawdata: result };
  // }

  async getAnalysisDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added param
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Time range ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Timestamp filter ---
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 4 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) projection[field] = 1;
    }

    // --- Fetch data ---
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval Selection (auto mode) ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;

    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<string, { returnSum: number; count: number }>();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, { returnSum: 0, count: 0 });
      }

      const group = groupMap.get(label)!;
      const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
      if (typeof cold === 'number') group.returnSum += cold;
      group.count++;
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 4 Data', rawdata: result };
  }

  // async getAnalysisDataChart5(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date range ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Time range ---
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // --- Timestamp filter (string-based to avoid last-hour missing issue) ---
  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) {
  //     return { message: 'Analysis Chart 5 Data', rawdata: [] };
  //   }

  //   const towerPrefix = `${dto.towerType}_`;
  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //     `${towerPrefix}TEMP_RTD_02_AI`,
  //   ];

  //   for (const field of requiredFields) {
  //     if (field in sampleDoc) projection[field] = 1;
  //   }

  //   // --- Fetch data ---
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 5 Data', rawdata: [] };

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<
  //     string,
  //     {
  //       evapLossSum: number;
  //       supplySum: number;
  //       returnSum: number;
  //       count: number;
  //     }
  //   >();

  //   const constant = 0.00085 * 1.8;

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     const flow = doc[`${towerPrefix}FM_02_FR`];
  //     const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //     const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //     if (
  //       typeof flow === 'number' &&
  //       typeof supply === 'number' &&
  //       typeof ret === 'number'
  //     ) {
  //       const evapLoss = constant * flow * (ret - supply);
  //       if (!groupMap.has(label)) {
  //         groupMap.set(label, {
  //           evapLossSum: 0,
  //           supplySum: 0,
  //           returnSum: 0,
  //           count: 0,
  //         });
  //       }
  //       const g = groupMap.get(label)!;
  //       g.evapLossSum += evapLoss;
  //       g.supplySum += supply;
  //       g.returnSum += ret;
  //       g.count++;
  //     }
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const g = groupMap.get(timestamp);
  //     const count = g?.count || 0;
  //     return {
  //       label: timestamp,
  //       evaporationLoss: count ? g!.evapLossSum / count : 0,
  //       supplyTemp: count ? g!.supplySum / count : 0,
  //       returnTemp: count ? g!.returnSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 5 Data', rawdata: result };
  // }

  async getAnalysisDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Time range ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Timestamp filter ---
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 5 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];

    for (const field of requiredFields) {
      if (field in sampleDoc) projection[field] = 1;
    }

    // --- Fetch data ---
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 5 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      {
        evapLossSum: number;
        supplySum: number;
        returnSum: number;
        count: number;
      }
    >();

    const constant = 0.00085 * 1.8;

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      const flow = doc[`${towerPrefix}FM_02_FR`];
      const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

      if (
        typeof flow === 'number' &&
        typeof supply === 'number' &&
        typeof ret === 'number'
      ) {
        const evapLoss = constant * flow * (ret - supply);

        if (!groupMap.has(label)) {
          groupMap.set(label, {
            evapLossSum: 0,
            supplySum: 0,
            returnSum: 0,
            count: 0,
          });
        }

        const g = groupMap.get(label)!;
        g.evapLossSum += evapLoss;
        g.supplySum += supply;
        g.returnSum += ret;
        g.count++;
      }
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        evaporationLoss: count ? g!.evapLossSum / count : 0,
        supplyTemp: count ? g!.supplySum / count : 0,
        returnTemp: count ? g!.returnSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 5 Data', rawdata: result };
  }

  // async getAnalysisDataChart6(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date range ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Time range ---
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // --- Timestamp filter (string-based) ---
  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Projection ---
  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };

  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) {
  //     return { message: 'Analysis Chart 6 Data', rawdata: [] };
  //   }

  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //   ];
  //   for (const field of requiredFields) {
  //     if (field in sampleDoc) projection[field] = 1;
  //   }

  //   // --- Fetch data ---
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 6 Data', rawdata: [] };

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<
  //     string,
  //     { returnSum: number; driftSum: number; count: number }
  //   >();

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //     const flowRate = doc[`${towerPrefix}FM_02_FR`];
  //     const driftLoss =
  //       typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : null;

  //     if (!groupMap.has(label)) {
  //       groupMap.set(label, { returnSum: 0, driftSum: 0, count: 0 });
  //     }
  //     const g = groupMap.get(label)!;

  //     if (typeof returnTemp === 'number') g.returnSum += returnTemp;
  //     if (typeof driftLoss === 'number') g.driftSum += driftLoss;
  //     g.count++;
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const g = groupMap.get(timestamp);
  //     const count = g?.count || 0;
  //     return {
  //       label: timestamp,
  //       returnTemp: count ? g!.returnSum / count : 0,
  //       driftLoss: count ? g!.driftSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 6 Data', rawdata: result };
  // }

  async getAnalysisDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Time range ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Timestamp filter ---
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 6 Data', rawdata: [] };
    }

    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
    ];
    for (const field of requiredFields) {
      if (field in sampleDoc) projection[field] = 1;
    }

    // --- Fetch data ---
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 6 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      { returnSum: number; driftSum: number; count: number }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const flowRate = doc[`${towerPrefix}FM_02_FR`];
      const driftLoss =
        typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : null;

      if (!groupMap.has(label)) {
        groupMap.set(label, { returnSum: 0, driftSum: 0, count: 0 });
      }
      const g = groupMap.get(label)!;

      if (typeof returnTemp === 'number') g.returnSum += returnTemp;
      if (typeof driftLoss === 'number') g.driftSum += driftLoss;
      g.count++;
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        returnTemp: count ? g!.returnSum / count : 0,
        driftLoss: count ? g!.driftSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 6 Data', rawdata: result };
  }

  // async getAnalysisDataChart7(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date range ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Time filter ---
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // --- Timestamp filter (ISO string) ---
  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Projection ---
  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 7 Data', rawdata: [] };

  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //     `${towerPrefix}TEMP_RTD_02_AI`,
  //   ];
  //   for (const field of requiredFields) {
  //     if (field in sampleDoc) projection[field] = 1;
  //   }

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 7 Data', rawdata: [] };

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<
  //     string,
  //     { blowdownSum: number; evapSum: number; count: number }
  //   >();
  //   const constant = 0.00085 * 1.8;

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     const flow = doc[`${towerPrefix}FM_02_FR`];
  //     const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //     const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //     if (
  //       typeof flow === 'number' &&
  //       typeof supply === 'number' &&
  //       typeof ret === 'number'
  //     ) {
  //       const evapLoss = constant * flow * (ret - supply);
  //       const blowdownRate = evapLoss / 6;

  //       if (!groupMap.has(label)) {
  //         groupMap.set(label, { blowdownSum: 0, evapSum: 0, count: 0 });
  //       }
  //       const g = groupMap.get(label)!;
  //       g.blowdownSum += blowdownRate;
  //       g.evapSum += evapLoss;
  //       g.count++;
  //     }
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const g = groupMap.get(timestamp);
  //     const count = g?.count || 0;
  //     return {
  //       label: timestamp,
  //       evaporationLoss: count ? g!.evapSum / count : 0,
  //       blowdownRate: count ? g!.blowdownSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 7 Data', rawdata: result };
  // }

  async getAnalysisDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Time filter ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Timestamp filter ---
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 7 Data', rawdata: [] };

    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];
    for (const field of requiredFields) {
      if (field in sampleDoc) projection[field] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 7 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      { blowdownSum: number; evapSum: number; count: number }
    >();
    const constant = 0.00085 * 1.8;

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      const flow = doc[`${towerPrefix}FM_02_FR`];
      const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

      if (
        typeof flow === 'number' &&
        typeof supply === 'number' &&
        typeof ret === 'number'
      ) {
        const evapLoss = constant * flow * (ret - supply);
        const blowdownRate = evapLoss / 6;

        if (!groupMap.has(label)) {
          groupMap.set(label, { blowdownSum: 0, evapSum: 0, count: 0 });
        }
        const g = groupMap.get(label)!;
        g.blowdownSum += blowdownRate;
        g.evapSum += evapLoss;
        g.count++;
      }
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        evaporationLoss: count ? g!.evapSum / count : 0,
        blowdownRate: count ? g!.blowdownSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 7 Data', rawdata: result };
  }

  // async getAnalysisDataChart8(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   const filter: any = {};
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const tz = 'Asia/Karachi';

  //   // --- Date range ---
  //   if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte)
  //       .setZone(tz)
  //       .startOf('day');
  //     endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
  //   } else if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
  //     endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   filter.timestamp = {
  //     $gte: startDate.toISO(),
  //     $lte: endDate.toISO(),
  //   };

  //   // --- Projection ---
  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 8 Data', rawdata: [] };

  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //     `${towerPrefix}TEMP_RTD_02_AI`,
  //   ];
  //   for (const field of requiredFields) {
  //     if (field in sampleDoc) projection[field] = 1;
  //   }

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 8 Data', rawdata: [] };

  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

  //   // --- Empty Buckets ---
  //   const emptyBuckets: { timestamp: string }[] = [];
  //   let cursor = startDate;
  //   while (cursor <= endDate) {
  //     emptyBuckets.push({
  //       timestamp:
  //         groupBy === 'hour'
  //           ? cursor.toFormat('yyyy-MM-dd HH:00')
  //           : cursor.toFormat('yyyy-MM-dd'),
  //     });
  //     cursor =
  //       groupBy === 'hour'
  //         ? cursor.plus({ hours: 1 })
  //         : cursor.plus({ days: 1 });
  //   }

  //   // --- Grouping ---
  //   const groupMap = new Map<
  //     string,
  //     {
  //       blowdownSum: number;
  //       evapSum: number;
  //       driftSum: number;
  //       makeupSum: number;
  //       count: number;
  //     }
  //   >();
  //   const constant = 0.00085 * 1.8;

  //   for (const doc of data) {
  //     const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
  //     const label =
  //       groupBy === 'hour'
  //         ? docDate.toFormat('yyyy-MM-dd HH:00')
  //         : docDate.toFormat('yyyy-MM-dd');

  //     const flow = doc[`${towerPrefix}FM_02_FR`];
  //     const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //     const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //     if (
  //       typeof flow === 'number' &&
  //       typeof supply === 'number' &&
  //       typeof ret === 'number'
  //     ) {
  //       const evapLoss = constant * flow * (ret - supply);
  //       const blowdownRate = evapLoss / 6;
  //       const driftLoss = 0.0005 * flow;
  //       const makeup = evapLoss + blowdownRate + driftLoss;

  //       if (!groupMap.has(label)) {
  //         groupMap.set(label, {
  //           blowdownSum: 0,
  //           evapSum: 0,
  //           driftSum: 0,
  //           makeupSum: 0,
  //           count: 0,
  //         });
  //       }

  //       const g = groupMap.get(label)!;
  //       g.blowdownSum += blowdownRate;
  //       g.evapSum += evapLoss;
  //       g.driftSum += driftLoss;
  //       g.makeupSum += makeup;
  //       g.count++;
  //     }
  //   }

  //   // --- Merge Buckets ---
  //   const result = emptyBuckets.map(({ timestamp }) => {
  //     const g = groupMap.get(timestamp);
  //     const count = g?.count || 0;
  //     return {
  //       label: timestamp,
  //       evaporationLoss: count ? g!.evapSum / count : 0,
  //       blowdownRate: count ? g!.blowdownSum / count : 0,
  //       driftLoss: count ? g!.driftSum / count : 0,
  //       makeupWater: count ? g!.makeupSum / count : 0,
  //     };
  //   });

  //   return { message: 'Analysis Chart 8 Data', rawdata: result };
  // }

  async getAnalysisDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day'; // ✅ added
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte, { zone: 'utc' })
        .setZone(tz)
        .endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    // --- Time filter ---
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // --- Timestamp filter ---
    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 8 Data', rawdata: [] };

    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];
    for (const field of requiredFields) {
      if (field in sampleDoc) projection[field] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 8 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : interval === '15min'
              ? cursor.toFormat('yyyy-MM-dd HH:mm')
              : cursor.toFormat('yyyy-MM-dd'),
      });

      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : interval === '15min'
            ? cursor.plus({ minutes: 15 })
            : cursor.plus({ days: 1 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      {
        blowdownSum: number;
        evapSum: number;
        driftSum: number;
        makeupSum: number;
        count: number;
      }
    >();
    const constant = 0.00085 * 1.8;

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else if (interval === '15min') {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      } else {
        label = docDate.toFormat('yyyy-MM-dd');
      }

      const flow = doc[`${towerPrefix}FM_02_FR`];
      const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

      if (
        typeof flow === 'number' &&
        typeof supply === 'number' &&
        typeof ret === 'number'
      ) {
        const evapLoss = constant * flow * (ret - supply);
        const blowdownRate = evapLoss / 6;
        const driftLoss = 0.0005 * flow;
        const makeup = evapLoss + blowdownRate + driftLoss;

        if (!groupMap.has(label)) {
          groupMap.set(label, {
            blowdownSum: 0,
            evapSum: 0,
            driftSum: 0,
            makeupSum: 0,
            count: 0,
          });
        }

        const g = groupMap.get(label)!;
        g.blowdownSum += blowdownRate;
        g.evapSum += evapLoss;
        g.driftSum += driftLoss;
        g.makeupSum += makeup;
        g.count++;
      }
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        evaporationLoss: count ? g!.evapSum / count : 0,
        blowdownRate: count ? g!.blowdownSum / count : 0,
        driftLoss: count ? g!.driftSum / count : 0,
        makeupWater: count ? g!.makeupSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 8 Data', rawdata: result };
  }

  async getAnalysisDataChart9(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour'; // NEW param
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte)
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };

    const ampFields = ['Current_AN_Amp', 'Current_BN_Amp', 'Current_CN_Amp'];
    const speedField = `${towerPrefix}INV_01_SPD_AI`;

    ampFields.forEach((suffix) => {
      projection[`${towerPrefix}EM01_${suffix}`] = 1;
    });
    projection[speedField] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length)
      return { message: 'Analysis Chart 9 - Fan Speed & Ampere', rawdata: [] };

    const interval = dto.interval ?? 'hour';

    // --- Empty Buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : cursor.toFormat('yyyy-MM-dd HH:mm'),
      });
      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : cursor.plus({ minutes: 15 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      { fanSpeedSum: number; fanAmpSum: number; count: number }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, { fanSpeedSum: 0, fanAmpSum: 0, count: 0 });
      }

      const g = groupMap.get(label)!;

      const speed = doc[speedField];
      const ampA = doc[`${towerPrefix}EM01_Current_AN_Amp`];
      const ampB = doc[`${towerPrefix}EM01_Current_BN_Amp`];
      const ampC = doc[`${towerPrefix}EM01_Current_CN_Amp`];

      const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
        ? (ampA + ampB + ampC) / 3
        : null;

      if (typeof speed === 'number') g.fanSpeedSum += speed;
      if (typeof fanAmp === 'number') g.fanAmpSum += fanAmp;
      g.count++;
    }

    // --- Merge Buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        fanSpeed: count ? g!.fanSpeedSum / count : 0,
        fanAmpere: count ? g!.fanAmpSum / count : 0,
      };
    });

    return {
      message: 'Analysis Chart 9 - Fan Speed & Ampere',
      rawdata: result,
    };
  }
  async getAnalysisDataChart10(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour';
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte)
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const towerPrefix = `${dto.towerType}_`;

    projection[`${towerPrefix}TEMP_RTD_01_AI`] = 1; // cold
    projection[`${towerPrefix}TEMP_RTD_02_AI`] = 1; // hot

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) {
      return { message: 'Analysis Chart 10 Data', rawdata: [] };
    }

    const interval = dto.interval ?? 'hour';
    const wetBulb = 28;
    const ambientAirTemp = 36;

    // --- Grouping ---
    const groupMap = new Map<string, { deltaTempSum: number; count: number }>();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, { deltaTempSum: 0, count: 0 });
      }

      const g = groupMap.get(label)!;
      const hot = doc[`${towerPrefix}TEMP_RTD_02_AI`];
      const cold = doc[`${towerPrefix}TEMP_RTD_01_AI`];

      if (typeof hot === 'number' && typeof cold === 'number') {
        g.deltaTempSum += hot - cold;
        g.count++;
      }
    }

    // --- Only keep intervals with data ---
    const result: any[] = [];
    for (const [label, g] of groupMap.entries()) {
      if (g.count > 0) {
        result.push({
          label,
          deltaTemp: g.deltaTempSum / g.count,
          wetBulb,
          ambientAirTemp,
        });
      }
    }

    return { message: 'Analysis Chart 10 Data', rawdata: result };
  }

  async getAnalysisDataChart11(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour';
  }) {
    const filter: any = {};
    const tz = 'Asia/Karachi';
    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date range ---
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte)
        .setZone(tz)
        .startOf('day');
      endDate = DateTime.fromJSDate(dateRange.$lte).setZone(tz).endOf('day');
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.toDate, { zone: tz }).endOf('day');
    } else if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).startOf('day');
      endDate = DateTime.fromISO(dto.date, { zone: tz }).endOf('day');
    } else {
      throw new Error('No date range provided');
    }

    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    filter.timestamp = {
      $gte: startDate.toISO(),
      $lte: endDate.toISO(),
    };

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const tower = dto.towerType!;

    projection[`${tower}_EM01_Current_AN_Amp`] = 1;
    projection[`${tower}_EM01_Current_BN_Amp`] = 1;
    projection[`${tower}_EM01_Current_CN_Amp`] = 1;
    projection[`${tower}_TEMP_RTD_01_AI`] = 1; // supply
    projection[`${tower}_TEMP_RTD_02_AI`] = 1; // return

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) {
      return { message: 'Analysis Chart 11 Data', rawdata: [] };
    }

    const interval = dto.interval ?? 'hour';

    // --- Empty buckets ---
    const emptyBuckets: { timestamp: string }[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      emptyBuckets.push({
        timestamp:
          interval === 'hour'
            ? cursor.toFormat('yyyy-MM-dd HH:00')
            : cursor.toFormat('yyyy-MM-dd HH:mm'),
      });
      cursor =
        interval === 'hour'
          ? cursor.plus({ hours: 1 })
          : cursor.plus({ minutes: 15 });
    }

    // --- Grouping ---
    const groupMap = new Map<
      string,
      { powerSum: number; supplySum: number; returnSum: number; count: number }
    >();

    for (const doc of data) {
      const docDate = DateTime.fromISO(doc.timestamp, { zone: tz });
      let label: string;

      if (interval === 'hour') {
        label = docDate.toFormat('yyyy-MM-dd HH:00');
      } else {
        const roundedMinutes = Math.floor(docDate.minute / 15) * 15;
        label = docDate
          .set({ minute: roundedMinutes, second: 0 })
          .toFormat('yyyy-MM-dd HH:mm');
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          powerSum: 0,
          supplySum: 0,
          returnSum: 0,
          count: 0,
        });
      }

      const g = groupMap.get(label)!;
      const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
      const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
      const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;

      const avgPower = (an + bn + cn) / 3;

      const supplyTemp = doc[`${tower}_TEMP_RTD_01_AI`];
      const returnTemp = doc[`${tower}_TEMP_RTD_02_AI`];

      g.powerSum += avgPower;
      if (typeof supplyTemp === 'number') g.supplySum += supplyTemp;
      if (typeof returnTemp === 'number') g.returnSum += returnTemp;
      g.count++;
    }

    // --- Merge buckets ---
    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        fanPower: count ? g!.powerSum / count : 0,
        supplyTemp: count ? g!.supplySum / count : 0,
        returnTemp: count ? g!.returnSum / count : 0,
      };
    });

    return { message: 'Analysis Chart 11 Data', rawdata: result };
  }

  // async getAnalysisDataChart12(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }

  // async getAnalysisDataChart13(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }

  // async getAnalysisDataChart14(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }

  // async getAnalysisDataChart15(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }

  // async getAnalysisDataChart16(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }

  // async getAnalysisDataChart17(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  // }) {
  //   // Initialize the query filter
  //   const filter: any = {};

  //   // Handle date range filtering
  //   if (dto.range) {
  //     // Use predefined range
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.fromDate && dto.toDate) {
  //     // Use custom date range
  //     const from = new Date(dto.fromDate);
  //     const to = new Date(dto.toDate);
  //     const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   } else if (dto.date) {
  //     // Use single date
  //     const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
  //     filter.timestamp = {
  //       $gte: dateRange.$gte,
  //       $lte: dateRange.$lte,
  //     };
  //   }

  //   // Handle time range filtering if provided
  //   if (dto.startTime && dto.endTime) {
  //     const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, timeFilter);
  //   }

  //   // If no tower type specified, return all data
  //   if (!dto.towerType) {
  //     return await this.AnalysisModel.find(filter).lean().exec();
  //   }

  //   // Create a projection that includes only fields for the specified tower type
  //   const projection: any = {
  //     _id: 1,
  //     timestamp: 1,
  //     UNIXtimestamp: 1,
  //   };

  //   // Get the first document to analyze the fields
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

  //   if (!sampleDoc) {
  //     return [];
  //   }

  //   // Find all fields that start with the towerType prefix
  //   const towerPrefix = `${dto.towerType}_`;
  //   Object.keys(sampleDoc).forEach((field) => {
  //     if (field.startsWith(towerPrefix)) {
  //       projection[field] = 1;
  //     }
  //   });

  //   // Execute query with projection
  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   return data;
  // }
}
