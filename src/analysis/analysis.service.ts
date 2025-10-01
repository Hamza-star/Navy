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

  async getAnalysisDataChart1(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);

    let startDate: DateTime;
    let endDate: DateTime;
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 1 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const wetBulb = 28;
    const result: {
      label: string;
      coolingEfficiency: number;
      supplyTemp: number;
      returnTemp: number;
      wetBulb: number;
    }[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValues = { coolingEfficiency: 0, supplyTemp: 0, returnTemp: 0 };

      // --- First 24 hours ---
      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let effSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const eff =
            typeof hot === 'number' &&
            typeof cold === 'number' &&
            hot - wetBulb !== 0
              ? ((hot - cold) / (hot - wetBulb)) * 100
              : null;
          if (eff !== null) effSum += eff;
          if (typeof hot === 'number') supplySum += hot;
          if (typeof cold === 'number') returnSum += cold;
          count++;
        }

        if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
          // --- Today: no data yet, use last known values ---
          result.push({
            label,
            coolingEfficiency: lastValues.coolingEfficiency,
            supplyTemp: lastValues.supplyTemp,
            returnTemp: lastValues.returnTemp,
            wetBulb,
          });
        } else {
          const avgEff = count ? effSum / count : 0;
          const avgSupply = count ? supplySum / count : 0;
          const avgReturn = count ? returnSum / count : 0;
          result.push({
            label,
            coolingEfficiency: avgEff,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
            wetBulb,
          });
          lastValues = {
            coolingEfficiency: avgEff,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
          };
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const hot = firstDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
        const cold = firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
        const eff =
          typeof hot === 'number' &&
          typeof cold === 'number' &&
          hot - wetBulb !== 0
            ? ((hot - cold) / (hot - wetBulb)) * 100
            : 0;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          coolingEfficiency: eff,
          supplyTemp: typeof hot === 'number' ? hot : 0,
          returnTemp: typeof cold === 'number' ? cold : 0,
          wetBulb,
        });
      }
    }
    // --- Hourly interval ---
    else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let effSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const eff =
            typeof hot === 'number' &&
            typeof cold === 'number' &&
            hot - wetBulb !== 0
              ? ((hot - cold) / (hot - wetBulb)) * 100
              : null;
          if (eff !== null) effSum += eff;
          if (typeof hot === 'number') supplySum += hot;
          if (typeof cold === 'number') returnSum += cold;
          count++;
        }

        const avgEff = count ? effSum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          coolingEfficiency: avgEff,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
          wetBulb,
        });

        cursor = cursor.plus({ hours: 1 });
      }
    }
    // --- Daily interval ---
    else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let effSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const eff =
            typeof hot === 'number' &&
            typeof cold === 'number' &&
            hot - wetBulb !== 0
              ? ((hot - cold) / (hot - wetBulb)) * 100
              : null;
          if (eff !== null) effSum += eff;
          if (typeof hot === 'number') supplySum += hot;
          if (typeof cold === 'number') returnSum += cold;
          count++;
        }

        const avgEff = count ? effSum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          coolingEfficiency: avgEff,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
          wetBulb,
        });

        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 1 Data', rawdata: result };
  }

  async getAnalysisDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    wetBulb?: number;
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime) {
      const custom = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, custom);
    }

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 2 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const wetBulb = dto.wetBulb ?? 28;
    const result: {
      label: string;
      approach: number;
      supplyTemp: number;
      returnTemp: number;
      wetBulb: number;
    }[] = [];

    // --- 15-min interval with carry-forward for today ---
    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValues = { approach: 0, supplyTemp: 0, returnTemp: 0 };

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let approachSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const approach =
            typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
          if (approach !== null) approachSum += approach;
          if (typeof supplyTemp === 'number') supplySum += supplyTemp;
          if (typeof returnTemp === 'number') returnSum += returnTemp;
          count++;
        }

        if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
          // carry-forward last known values
          result.push({
            label,
            approach: lastValues.approach,
            supplyTemp: lastValues.supplyTemp,
            returnTemp: lastValues.returnTemp,
            wetBulb,
          });
        } else {
          const avgApproach = count ? approachSum / count : 0;
          const avgSupply = count ? supplySum / count : 0;
          const avgReturn = count ? returnSum / count : 0;
          result.push({
            label,
            approach: avgApproach,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
            wetBulb,
          });
          lastValues = {
            approach: avgApproach,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
          };
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const supplyTemp = firstDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
        const returnTemp = firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
        const approach =
          typeof returnTemp === 'number' ? returnTemp - wetBulb : 0;
        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          approach,
          supplyTemp: typeof supplyTemp === 'number' ? supplyTemp : 0,
          returnTemp: typeof returnTemp === 'number' ? returnTemp : 0,
          wetBulb,
        });
      }
    }
    // --- Hourly interval ---
    else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let approachSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const approach =
            typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
          if (approach !== null) approachSum += approach;
          if (typeof supplyTemp === 'number') supplySum += supplyTemp;
          if (typeof returnTemp === 'number') returnSum += returnTemp;
          count++;
        }

        const avgApproach = count ? approachSum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          approach: avgApproach,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
          wetBulb,
        });

        cursor = cursor.plus({ hours: 1 });
      }
    }
    // --- Daily interval ---
    else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let approachSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          const approach =
            typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
          if (approach !== null) approachSum += approach;
          if (typeof supplyTemp === 'number') supplySum += supplyTemp;
          if (typeof returnTemp === 'number') returnSum += returnTemp;
          count++;
        }

        const avgApproach = count ? approachSum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          approach: avgApproach,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
          wetBulb,
        });

        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 2 Data', rawdata: result };
  }

  async getAnalysisDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const Cp = 4.186;

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime) {
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 3 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const result: {
      label: string;
      coolingCapacity: number;
      supplyTemp: number;
      returnTemp: number;
    }[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValues = { capacity: 0, supplyTemp: 0, returnTemp: 0 };

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let capacitySum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const flow = doc[`${dto.towerType}_FM_02_FR`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (
            typeof flow === 'number' &&
            typeof returnTemp === 'number' &&
            typeof supplyTemp === 'number'
          ) {
            capacitySum += Cp * flow * (returnTemp - supplyTemp);
            supplySum += supplyTemp;
            returnSum += returnTemp;
            count++;
          }
        }

        if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
          // carry-forward last known values
          result.push({
            label,
            coolingCapacity: lastValues.capacity,
            supplyTemp: lastValues.supplyTemp,
            returnTemp: lastValues.returnTemp,
          });
        } else {
          const avgCapacity = count ? capacitySum / count : 0;
          const avgSupply = count ? supplySum / count : 0;
          const avgReturn = count ? returnSum / count : 0;
          result.push({
            label,
            coolingCapacity: avgCapacity,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
          });
          lastValues = {
            capacity: avgCapacity,
            supplyTemp: avgSupply,
            returnTemp: avgReturn,
          };
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const flow = firstDoc[`${dto.towerType}_FM_02_FR`];
        const returnTemp = firstDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
        const supplyTemp = firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
        const capacity =
          typeof flow === 'number' &&
          typeof returnTemp === 'number' &&
          typeof supplyTemp === 'number'
            ? Cp * flow * (returnTemp - supplyTemp)
            : 0;
        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          coolingCapacity: capacity,
          supplyTemp: typeof supplyTemp === 'number' ? supplyTemp : 0,
          returnTemp: typeof returnTemp === 'number' ? returnTemp : 0,
        });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let capacitySum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const flow = doc[`${dto.towerType}_FM_02_FR`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (
            typeof flow === 'number' &&
            typeof returnTemp === 'number' &&
            typeof supplyTemp === 'number'
          ) {
            capacitySum += Cp * flow * (returnTemp - supplyTemp);
            supplySum += supplyTemp;
            returnSum += returnTemp;
            count++;
          }
        }

        const avgCapacity = count ? capacitySum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          coolingCapacity: avgCapacity,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
        });

        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let capacitySum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const flow = doc[`${dto.towerType}_FM_02_FR`];
          const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
          const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (
            typeof flow === 'number' &&
            typeof returnTemp === 'number' &&
            typeof supplyTemp === 'number'
          ) {
            capacitySum += Cp * flow * (returnTemp - supplyTemp);
            supplySum += supplyTemp;
            returnSum += returnTemp;
            count++;
          }
        }

        const avgCapacity = count ? capacitySum / count : 0;
        const avgSupply = count ? supplySum : 0;
        const avgReturn = count ? returnSum : 0;
        result.push({
          label,
          coolingCapacity: avgCapacity,
          supplyTemp: avgSupply,
          returnTemp: avgReturn,
        });

        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 3 Data', rawdata: result };
  }

  async getAnalysisDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 4 Data', rawdata: [] };
    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const result: { label: string; returnTemp: number }[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValue = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let sum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (typeof val === 'number') {
            sum += val;
            count++;
          }
        }

        const avg = count ? sum / count : lastValue;
        result.push({ label, returnTemp: avg });
        if (count) lastValue = avg;

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const val =
          typeof firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`] === 'number'
            ? firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`]
            : 0;
        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({ label: label25, returnTemp: val });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let sum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (typeof val === 'number') {
            sum += val;
            count++;
          }
        }

        result.push({ label, returnTemp: count ? sum / count : 0 });
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let sum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
          if (typeof val === 'number') {
            sum += val;
            count++;
          }
        }

        result.push({ label, returnTemp: count ? sum / count : 0 });
        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 4 Data', rawdata: result };
  }

  async getAnalysisDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 5 Data', rawdata: [] };
    const towerPrefix = `${dto.towerType}_`;
    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];
    for (const field of requiredFields)
      if (field in sampleDoc) projection[field] = 1;

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

    const constant = 0.00085 * 1.8;
    const result: {
      label: string;
      evaporationLoss: number;
      supplyTemp: number;
      returnTemp: number;
    }[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastEvap = 0,
        lastSupply = 0,
        lastReturn = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let evapSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;

        for (const doc of docsInBucket) {
          const flow = doc[`${towerPrefix}FM_02_FR`];
          const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

          if (
            typeof flow === 'number' &&
            typeof supply === 'number' &&
            typeof ret === 'number'
          ) {
            evapSum += constant * flow * (ret - supply);
            supplySum += supply;
            returnSum += ret;
            count++;
          }
        }

        const evap = count ? evapSum / count : lastEvap;
        const supply = count ? supplySum / count : lastSupply;
        const ret = count ? returnSum / count : lastReturn;

        result.push({
          label,
          evaporationLoss: evap,
          supplyTemp: supply,
          returnTemp: ret,
        });

        if (count) {
          lastEvap = evap;
          lastSupply = supply;
          lastReturn = ret;
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: first document only ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const flow = firstDoc[`${towerPrefix}FM_02_FR`];
        const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`];
        const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`];
        const evap =
          typeof flow === 'number' &&
          typeof supply === 'number' &&
          typeof ret === 'number'
            ? constant * flow * (ret - supply)
            : 0;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          evaporationLoss: evap,
          supplyTemp: supply ?? 0,
          returnTemp: ret ?? 0,
        });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let evapSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const flow = doc[`${towerPrefix}FM_02_FR`];
          const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
          if (
            typeof flow === 'number' &&
            typeof supply === 'number' &&
            typeof ret === 'number'
          ) {
            evapSum += constant * flow * (ret - supply);
            supplySum += supply;
            returnSum += ret;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          supplyTemp: count ? supplySum / count : 0,
          returnTemp: count ? returnSum / count : 0,
        });
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let evapSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const flow = doc[`${towerPrefix}FM_02_FR`];
          const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
          if (
            typeof flow === 'number' &&
            typeof supply === 'number' &&
            typeof ret === 'number'
          ) {
            evapSum += constant * flow * (ret - supply);
            supplySum += supply;
            returnSum += ret;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          supplyTemp: count ? supplySum / count : 0,
          returnTemp: count ? returnSum / count : 0,
        });
        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 5 Data', rawdata: result };
  }

  async getAnalysisDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 6 Data', rawdata: [] };

    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
    ];
    for (const field of requiredFields)
      if (field in sampleDoc) projection[field] = 1;

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

    const result: { label: string; returnTemp: number; driftLoss: number }[] =
      [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastReturn = 0,
        lastDrift = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let returnSum = 0,
          driftSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const flowRate = doc[`${towerPrefix}FM_02_FR`];
          const driftLoss =
            typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

          if (typeof returnTemp === 'number') returnSum += returnTemp;
          driftSum += driftLoss;
          count++;
        }

        const ret = count ? returnSum / count : lastReturn;
        const drift = count ? driftSum / count : lastDrift;

        result.push({ label, returnTemp: ret, driftLoss: drift });

        if (count) {
          lastReturn = ret;
          lastDrift = drift;
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: first document only ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const returnTemp = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
        const flowRate = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
        const driftLoss = (0.05 * flowRate) / 100;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({ label: label25, returnTemp, driftLoss });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let returnSum = 0,
          driftSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const flowRate = doc[`${towerPrefix}FM_02_FR`];
          const driftLoss =
            typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

          if (typeof returnTemp === 'number') returnSum += returnTemp;
          driftSum += driftLoss;
          count++;
        }

        result.push({
          label,
          returnTemp: count ? returnSum / count : 0,
          driftLoss: count ? driftSum / count : 0,
        });
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let returnSum = 0,
          driftSum = 0,
          count = 0;
        for (const doc of dayDocs) {
          const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
          const flowRate = doc[`${towerPrefix}FM_02_FR`];
          const driftLoss =
            typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

          if (typeof returnTemp === 'number') returnSum += returnTemp;
          driftSum += driftLoss;
          count++;
        }

        result.push({
          label,
          returnTemp: count ? returnSum / count : 0,
          driftLoss: count ? driftSum / count : 0,
        });
        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 6 Data', rawdata: result };
  }

  async getAnalysisDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

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
    for (const field of requiredFields)
      if (field in sampleDoc) projection[field] = 1;

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

    const result: {
      label: string;
      evaporationLoss: number;
      blowdownRate: number;
    }[] = [];
    const constant = 0.00085 * 1.8;

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastEvap = 0,
        lastBlow = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let evapSum = 0,
          blowSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
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
            evapSum += evapLoss;
            blowSum += blowdownRate;
            count++;
          }
        }

        const evap = count ? evapSum / count : lastEvap;
        const blow = count ? blowSum / count : lastBlow;

        result.push({ label, evaporationLoss: evap, blowdownRate: blow });

        if (count) {
          lastEvap = evap;
          lastBlow = blow;
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: first document only ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const flow = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
        const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
        const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`] ?? 0;
        const evapLoss = constant * flow * (ret - supply);
        const blowdownRate = evapLoss / 6;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          evaporationLoss: evapLoss,
          blowdownRate,
        });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let evapSum = 0,
          blowSum = 0,
          count = 0;
        for (const doc of hourDocs) {
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
            evapSum += evapLoss;
            blowSum += blowdownRate;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          blowdownRate: count ? blowSum / count : 0,
        });

        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let evapSum = 0,
          blowSum = 0,
          count = 0;
        for (const doc of dayDocs) {
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
            evapSum += evapLoss;
            blowSum += blowdownRate;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          blowdownRate: count ? blowSum / count : 0,
        });

        cursor = cursor.plus({ days: 1 });
      }
    }

    return { message: 'Analysis Chart 7 Data', rawdata: result };
  }

  async getAnalysisDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;

    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
        .setZone(tz)
        .set({ hour: 6, minute: 0, second: 0 });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

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
    for (const field of requiredFields)
      if (field in sampleDoc) projection[field] = 1;

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

    const result: {
      label: string;
      evaporationLoss: number;
      blowdownRate: number;
      driftLoss: number;
      makeupWater: number;
    }[] = [];
    const constant = 0.00085 * 1.8;

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastEvap = 0,
        lastBlow = 0,
        lastDrift = 0,
        lastMakeup = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let evapSum = 0,
          blowSum = 0,
          driftSum = 0,
          makeupSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
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

            evapSum += evapLoss;
            blowSum += blowdownRate;
            driftSum += driftLoss;
            makeupSum += makeup;
            count++;
          }
        }

        const evap = count ? evapSum / count : lastEvap;
        const blow = count ? blowSum / count : lastBlow;
        const drift = count ? driftSum / count : lastDrift;
        const makeup = count ? makeupSum / count : lastMakeup;

        result.push({
          label,
          evaporationLoss: evap,
          blowdownRate: blow,
          driftLoss: drift,
          makeupWater: makeup,
        });

        if (count) {
          lastEvap = evap;
          lastBlow = blow;
          lastDrift = drift;
          lastMakeup = makeup;
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: first document only ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const flow = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
        const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
        const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`] ?? 0;
        const evapLoss = constant * flow * (ret - supply);
        const blowdownRate = evapLoss / 6;
        const driftLoss = 0.0005 * flow;
        const makeup = evapLoss + blowdownRate + driftLoss;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({
          label: label25,
          evaporationLoss: evapLoss,
          blowdownRate,
          driftLoss,
          makeupWater: makeup,
        });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let evapSum = 0,
          blowSum = 0,
          driftSum = 0,
          makeupSum = 0,
          count = 0;
        for (const doc of hourDocs) {
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
            evapSum += evapLoss;
            blowSum += blowdownRate;
            driftSum += driftLoss;
            makeupSum += makeup;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          blowdownRate: count ? blowSum / count : 0,
          driftLoss: count ? driftSum / count : 0,
          makeupWater: count ? makeupSum / count : 0,
        });

        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd');
        const dayDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ days: 1 });
        });

        let evapSum = 0,
          blowSum = 0,
          driftSum = 0,
          makeupSum = 0,
          count = 0;
        for (const doc of dayDocs) {
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
            evapSum += evapLoss;
            blowSum += blowdownRate;
            driftSum += driftLoss;
            makeupSum += makeup;
            count++;
          }
        }

        result.push({
          label,
          evaporationLoss: count ? evapSum / count : 0,
          blowdownRate: count ? blowSum / count : 0,
          driftLoss: count ? driftSum / count : 0,
          makeupWater: count ? makeupSum / count : 0,
        });

        cursor = cursor.plus({ days: 1 });
      }
    }

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
    interval?: '15min' | 'hour';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const tower = dto.towerType!;

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;
    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    projection[`${tower}_INV_01_SPD_AI`] = 1;
    ['Current_AN_Amp', 'Current_BN_Amp', 'Current_CN_Amp'].forEach((s) => {
      projection[`${tower}_EM01_${s}`] = 1;
    });

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 9 Data', rawdata: [] };

    const interval: '15min' | 'hour' = dto.interval ?? 'hour';
    const result: any[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValues = { fanSpeed: 0, fanAmp: 0 };

      // --- First 24 hours
      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let speedSum = 0,
          ampSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const speed = doc[`${tower}_INV_01_SPD_AI`];
          const ampA = doc[`${tower}_EM01_Current_AN_Amp`];
          const ampB = doc[`${tower}_EM01_Current_BN_Amp`];
          const ampC = doc[`${tower}_EM01_Current_CN_Amp`];
          const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
            ? (ampA + ampB + ampC) / 3
            : null;

          if (typeof speed === 'number') speedSum += speed;
          if (typeof fanAmp === 'number') ampSum += fanAmp;
          count++;
        }

        if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
          result.push({
            label,
            fanSpeed: lastValues.fanSpeed,
            fanAmp: lastValues.fanAmp,
          });
        } else {
          const avgSpeed = count ? speedSum / count : 0;
          const avgAmp = count ? ampSum / count : 0;
          result.push({ label, fanSpeed: avgSpeed, fanAmp: avgAmp });
          lastValues = { fanSpeed: avgSpeed, fanAmp: avgAmp };
        }

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const speed = firstDoc[`${tower}_INV_01_SPD_AI`] ?? 0;
        const ampA = firstDoc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
        const ampB = firstDoc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
        const ampC = firstDoc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
        const fanAmp = (ampA + ampB + ampC) / 3;

        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({ label: label25, fanSpeed: speed, fanAmp });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let speedSum = 0,
          ampSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const speed = doc[`${tower}_INV_01_SPD_AI`];
          const ampA = doc[`${tower}_EM01_Current_AN_Amp`];
          const ampB = doc[`${tower}_EM01_Current_BN_Amp`];
          const ampC = doc[`${tower}_EM01_Current_CN_Amp`];
          const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
            ? (ampA + ampB + ampC) / 3
            : null;

          if (typeof speed === 'number') speedSum += speed;
          if (typeof fanAmp === 'number') ampSum += fanAmp;
          count++;
        }

        result.push({
          label,
          fanSpeed: count ? speedSum / count : 0,
          fanAmp: count ? ampSum / count : 0,
        });
        cursor = cursor.plus({ hours: 1 });
      }
    }

    return { message: 'Analysis Chart 9 Data', rawdata: result };
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
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const tower = dto.towerType!;

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;
    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    projection[`${tower}_TEMP_RTD_01_AI`] = 1; // cold
    projection[`${tower}_TEMP_RTD_02_AI`] = 1; // hot

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 10 Data', rawdata: [] };

    const interval: '15min' | 'hour' = dto.interval ?? 'hour';
    const wetBulb = 28;
    const ambientAirTemp = 36;
    const result: any[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastDelta = 0;

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let deltaSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const hot = doc[`${tower}_TEMP_RTD_02_AI`];
          const cold = doc[`${tower}_TEMP_RTD_01_AI`];
          if (typeof hot === 'number' && typeof cold === 'number') {
            deltaSum += hot - cold;
            count++;
          }
        }

        const deltaTemp = count ? deltaSum / count : lastDelta;
        if (count) lastDelta = deltaTemp;
        result.push({ label, deltaTemp, wetBulb, ambientAirTemp });

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const hot = firstDoc[`${tower}_TEMP_RTD_02_AI`] ?? 0;
        const cold = firstDoc[`${tower}_TEMP_RTD_01_AI`] ?? 0;
        const deltaTemp = hot - cold;
        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({ label: label25, deltaTemp, wetBulb, ambientAirTemp });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let deltaSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const hot = doc[`${tower}_TEMP_RTD_02_AI`];
          const cold = doc[`${tower}_TEMP_RTD_01_AI`];
          if (typeof hot === 'number' && typeof cold === 'number') {
            deltaSum += hot - cold;
            count++;
          }
        }

        result.push({
          label,
          deltaTemp: count ? deltaSum / count : 0,
          wetBulb,
          ambientAirTemp,
        });
        cursor = cursor.plus({ hours: 1 });
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
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const tower = dto.towerType!;

    // --- Determine start and end ---
    let startDate: DateTime;
    let endDate: DateTime;
    if (dto.date) {
      startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (dto.date === todayStr) endDate = now;
    } else if (dto.fromDate && dto.toDate) {
      startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = DateTime.fromISO(dto.toDate, { zone: tz })
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (dto.toDate === todayStr) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
        hour: 6,
        minute: 0,
        second: 0,
      });
      endDate = startDate.plus({ hours: 25 });
      if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection ---
    const projection: any = { _id: 0, timestamp: 1 };
    [
      'EM01_Current_AN_Amp',
      'EM01_Current_BN_Amp',
      'EM01_Current_CN_Amp',
    ].forEach((s) => {
      projection[`${tower}_${s}`] = 1;
    });
    projection[`${tower}_TEMP_RTD_01_AI`] = 1; // supply
    projection[`${tower}_TEMP_RTD_02_AI`] = 1; // return

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 11 Data', rawdata: [] };

    const interval: '15min' | 'hour' = dto.interval ?? 'hour';
    const result: any[] = [];

    if (interval === '15min') {
      const cursorEnd24h = startDate.plus({ hours: 24 });
      let cursor = startDate;
      let lastValues = { fanPower: 0, supplyTemp: 0, returnTemp: 0 };

      while (cursor < cursorEnd24h && cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:mm');
        const docsInBucket = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ minutes: 15 });
        });

        let powerSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of docsInBucket) {
          const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
          const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
          const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
          const avgPower = (an + bn + cn) / 3;
          powerSum += avgPower;

          const supply = doc[`${tower}_TEMP_RTD_01_AI`];
          const ret = doc[`${tower}_TEMP_RTD_02_AI`];
          if (typeof supply === 'number') supplySum += supply;
          if (typeof ret === 'number') returnSum += ret;
          count++;
        }

        const fanPower = count ? powerSum / count : lastValues.fanPower;
        const supplyTemp = count ? supplySum / count : lastValues.supplyTemp;
        const returnTemp = count ? returnSum / count : lastValues.returnTemp;

        result.push({ label, fanPower, supplyTemp, returnTemp });
        lastValues = { fanPower, supplyTemp, returnTemp };

        cursor = cursor.plus({ minutes: 15 });
      }

      // --- 25th hour: only first document ---
      if (data.length > 0 && cursor < endDate) {
        const firstDoc = data[0];
        const an = firstDoc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
        const bn = firstDoc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
        const cn = firstDoc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
        const fanPower = (an + bn + cn) / 3;
        const supplyTemp = firstDoc[`${tower}_TEMP_RTD_01_AI`] ?? 0;
        const returnTemp = firstDoc[`${tower}_TEMP_RTD_02_AI`] ?? 0;
        const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
        result.push({ label: label25, fanPower, supplyTemp, returnTemp });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        const label = cursor.toFormat('yyyy-MM-dd HH:00');
        const hourDocs = data.filter((d) => {
          const ts = DateTime.fromISO(d.timestamp, { zone: tz });
          return ts >= cursor && ts < cursor.plus({ hours: 1 });
        });

        let powerSum = 0,
          supplySum = 0,
          returnSum = 0,
          count = 0;
        for (const doc of hourDocs) {
          const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
          const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
          const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
          powerSum += (an + bn + cn) / 3;

          const supply = doc[`${tower}_TEMP_RTD_01_AI`];
          const ret = doc[`${tower}_TEMP_RTD_02_AI`];
          if (typeof supply === 'number') supplySum += supply;
          if (typeof ret === 'number') returnSum += ret;
          count++;
        }

        result.push({
          label,
          fanPower: count ? powerSum / count : 0,
          supplyTemp: count ? supplySum / count : 0,
          returnTemp: count ? returnSum / count : 0,
        });
        cursor = cursor.plus({ hours: 1 });
      }
    }

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
