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
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);

  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 1 Data', rawdata: [] };

  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   for (const field in sampleDoc)
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const wetBulb = 28;
  //   const result: {
  //     label: string;
  //     coolingEfficiency: number;
  //     supplyTemp: number;
  //     returnTemp: number;
  //     wetBulb: number;
  //   }[] = [];

  //   // --- 15min interval (future-safe & optimized) ---
  //   if (interval === '15min') {
  //     let lastValues = { coolingEfficiency: 0, supplyTemp: 0, returnTemp: 0 };

  //     // Pre-group data by 15min bucket
  //     const bucketedData = new Map<string, (typeof data)[0][]>();
  //     for (const doc of data) {
  //       const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
  //       const bucket = ts
  //         .startOf('minute')
  //         .minus({ minutes: ts.minute % 15 })
  //         .toISO();
  //       if (!bucketedData.has(bucket)) bucketedData.set(bucket, []);
  //       bucketedData.get(bucket)!.push(doc);
  //     }

  //     const sortedBuckets = Array.from(bucketedData.keys()).sort();
  //     for (const bucketKey of sortedBuckets) {
  //       const cursor = DateTime.fromISO(bucketKey, { zone: tz });
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = bucketedData.get(bucketKey)!;

  //       let effSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;

  //       for (const doc of docsInBucket) {
  //         const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const eff =
  //           typeof hot === 'number' &&
  //           typeof cold === 'number' &&
  //           hot - wetBulb !== 0
  //             ? ((hot - cold) / (hot - wetBulb)) * 100
  //             : null;

  //         if (eff !== null) effSum += eff;
  //         if (typeof hot === 'number') supplySum += hot;
  //         if (typeof cold === 'number') returnSum += cold;
  //         count++;
  //       }

  //       const avgEff = count ? effSum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;

  //       result.push({
  //         label,
  //         coolingEfficiency: avgEff,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //         wetBulb,
  //       });
  //       lastValues = {
  //         coolingEfficiency: avgEff,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //       };
  //     }
  //   }

  //   // --- Hourly interval (future-safe) ---
  //   else if (interval === 'hour') {
  //     const bucketedData = new Map<string, (typeof data)[0][]>();
  //     for (const doc of data) {
  //       const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
  //       const bucket = ts.startOf('hour').toISO();
  //       if (!bucketedData.has(bucket)) bucketedData.set(bucket, []);
  //       bucketedData.get(bucket)!.push(doc);
  //     }

  //     const sortedBuckets = Array.from(bucketedData.keys()).sort();
  //     for (const bucketKey of sortedBuckets) {
  //       const cursor = DateTime.fromISO(bucketKey, { zone: tz });
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const docsInBucket = bucketedData.get(bucketKey)!;

  //       let effSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const eff =
  //           typeof hot === 'number' &&
  //           typeof cold === 'number' &&
  //           hot - wetBulb !== 0
  //             ? ((hot - cold) / (hot - wetBulb)) * 100
  //             : null;
  //         if (eff !== null) effSum += eff;
  //         if (typeof hot === 'number') supplySum += hot;
  //         if (typeof cold === 'number') returnSum += cold;
  //         count++;
  //       }

  //       const avgEff = count ? effSum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         coolingEfficiency: avgEff,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //         wetBulb,
  //       });
  //     }
  //   }

  //   // --- Daily interval (future-safe) ---
  //   else if (interval === 'day') {
  //     const bucketedData = new Map<string, (typeof data)[0][]>();
  //     for (const doc of data) {
  //       const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
  //       const bucket = ts.startOf('day').toISO();
  //       if (!bucketedData.has(bucket)) bucketedData.set(bucket, []);
  //       bucketedData.get(bucket)!.push(doc);
  //     }

  //     const sortedBuckets = Array.from(bucketedData.keys()).sort();
  //     for (const bucketKey of sortedBuckets) {
  //       const cursor = DateTime.fromISO(bucketKey, { zone: tz });
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const docsInBucket = bucketedData.get(bucketKey)!;

  //       let effSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const eff =
  //           typeof hot === 'number' &&
  //           typeof cold === 'number' &&
  //           hot - wetBulb !== 0
  //             ? ((hot - cold) / (hot - wetBulb)) * 100
  //             : null;
  //         if (eff !== null) effSum += eff;
  //         if (typeof hot === 'number') supplySum += hot;
  //         if (typeof cold === 'number') returnSum += cold;
  //         count++;
  //       }

  //       const avgEff = count ? effSum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         coolingEfficiency: avgEff,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //         wetBulb,
  //       });
  //     }
  //   }

  //   return { message: 'Analysis Chart 1 Data', rawdata: result };
  // }

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
    const todayStr = now.toFormat('yyyy-MM-dd');
    const wetBulb = 28;

    // --- Determine start & end ---
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

      const gteVal = dateRange.$gte as unknown;
      const lteVal = dateRange.$lte as unknown;

      const gteDate =
        gteVal instanceof Date
          ? DateTime.fromJSDate(gteVal, { zone: tz })
          : DateTime.fromISO(String(gteVal), { zone: tz });
      const lteDate =
        lteVal instanceof Date
          ? DateTime.fromJSDate(lteVal, { zone: tz })
          : DateTime.fromISO(String(lteVal), { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
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
    if (!data.length) return { message: 'Analysis Chart 1 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    const excludedTimes = ['06:15', '06:30', '06:45'];
    const result: {
      label: string;
      coolingEfficiency: number;
      supplyTemp: number;
      returnTemp: number;
      wetBulb: number;
    }[] = [];

    // --- Helper: get first doc per bucket ---
    const getFirstPerBucket = (
      docs: typeof data,
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, (typeof docs)[0]>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key)!.timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    const pushIfNotExcluded = (
      ts: DateTime,
      eff: number,
      hot: number,
      cold: number,
      format: string,
    ) => {
      const label = ts.toFormat(format);
      const isLastHour = ts > endDate.minus({ hours: 1 });
      if (isLastHour && excludedTimes.some((ex) => label.endsWith(ex))) return;
      result.push({
        label,
        coolingEfficiency: eff,
        supplyTemp: hot ?? 0,
        returnTemp: cold ?? 0,
        wetBulb,
      });
    };

    // --- Define bucket function ---
    let bucketFn: (ts: DateTime) => string;
    let labelFormat: string;
    if (interval === '15min') {
      bucketFn = (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO();
      labelFormat = 'yyyy-MM-dd HH:mm';
    } else if (interval === 'hour') {
      bucketFn = (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO();
      labelFormat = 'yyyy-MM-dd HH:00';
    } else {
      bucketFn = (ts) => ts.startOf('day').toISO();
      labelFormat = 'yyyy-MM-dd';
    }

    const firstPerBucket = getFirstPerBucket(data, bucketFn);

    for (const { bucket, doc } of firstPerBucket) {
      const ts = DateTime.fromISO(bucket, { zone: tz });
      const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
      const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
      const eff =
        typeof hot === 'number' &&
        typeof cold === 'number' &&
        hot - wetBulb !== 0
          ? ((hot - cold) / (hot - wetBulb)) * 100
          : 0;
      pushIfNotExcluded(ts, eff, hot, cold, labelFormat);
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime) {
  //     const custom = this.mongoDateFilter.getCustomTimeRange(
  //       dto.startTime,
  //       dto.endTime,
  //     );
  //     Object.assign(filter, custom);
  //   }

  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 2 Data', rawdata: [] };

  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   for (const field in sampleDoc)
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const wetBulb = dto.wetBulb ?? 28;
  //   const result: {
  //     label: string;
  //     approach: number;
  //     supplyTemp: number;
  //     returnTemp: number;
  //     wetBulb: number;
  //   }[] = [];

  //   // --- 15-min interval with carry-forward for today ---
  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastValues = { approach: 0, supplyTemp: 0, returnTemp: 0 };

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let approachSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const approach =
  //           typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
  //         if (approach !== null) approachSum += approach;
  //         if (typeof supplyTemp === 'number') supplySum += supplyTemp;
  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         count++;
  //       }

  //       if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
  //         // carry-forward last known values
  //         result.push({
  //           label,
  //           approach: lastValues.approach,
  //           supplyTemp: lastValues.supplyTemp,
  //           returnTemp: lastValues.returnTemp,
  //           wetBulb,
  //         });
  //       } else {
  //         const avgApproach = count ? approachSum / count : 0;
  //         const avgSupply = count ? supplySum / count : 0;
  //         const avgReturn = count ? returnSum / count : 0;
  //         result.push({
  //           label,
  //           approach: avgApproach,
  //           supplyTemp: avgSupply,
  //           returnTemp: avgReturn,
  //           wetBulb,
  //         });
  //         lastValues = {
  //           approach: avgApproach,
  //           supplyTemp: avgSupply,
  //           returnTemp: avgReturn,
  //         };
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const supplyTemp = firstDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //       const returnTemp = firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //       const approach =
  //         typeof returnTemp === 'number' ? returnTemp - wetBulb : 0;
  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({
  //         label: label25,
  //         approach,
  //         supplyTemp: typeof supplyTemp === 'number' ? supplyTemp : 0,
  //         returnTemp: typeof returnTemp === 'number' ? returnTemp : 0,
  //         wetBulb,
  //       });
  //     }
  //   }
  //   // --- Hourly interval ---
  //   else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let approachSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const approach =
  //           typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
  //         if (approach !== null) approachSum += approach;
  //         if (typeof supplyTemp === 'number') supplySum += supplyTemp;
  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         count++;
  //       }

  //       const avgApproach = count ? approachSum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         approach: avgApproach,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //         wetBulb,
  //       });

  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   }
  //   // --- Daily interval ---
  //   else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let approachSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         const approach =
  //           typeof returnTemp === 'number' ? returnTemp - wetBulb : null;
  //         if (approach !== null) approachSum += approach;
  //         if (typeof supplyTemp === 'number') supplySum += supplyTemp;
  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         count++;
  //       }

  //       const avgApproach = count ? approachSum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         approach: avgApproach,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //         wetBulb,
  //       });

  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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

      // ✅ Safe conversion for both string and Date
      const gteVal = dateRange.$gte as unknown;
      const lteVal = dateRange.$lte as unknown;

      const gteDate =
        gteVal instanceof Date
          ? DateTime.fromJSDate(gteVal, { zone: tz })
          : DateTime.fromISO(String(gteVal), { zone: tz });

      const lteDate =
        lteVal instanceof Date
          ? DateTime.fromJSDate(lteVal, { zone: tz })
          : DateTime.fromISO(String(lteVal), { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
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

    // --- Sample doc & projection ---
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 2 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 2 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    const wetBulb = dto.wetBulb ?? 28;
    const result: {
      label: string;
      approach: number;
      supplyTemp: number;
      returnTemp: number;
      wetBulb: number;
    }[] = [];

    // --- Excluded times (apply only to last hour) ---
    const excludedTimes = ['06:15', '06:30', '06:45'];

    // --- Helper: get first doc per bucket ---
    const getFirstPerBucket = (
      docs: typeof data,
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, (typeof docs)[0]>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key)!.timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Bucket & label function ---
    let bucketFn: (ts: DateTime) => string;
    let labelFormat: string;
    if (interval === '15min') {
      bucketFn = (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO();
      labelFormat = 'yyyy-MM-dd HH:mm';
    } else if (interval === 'hour') {
      bucketFn = (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO();
      labelFormat = 'yyyy-MM-dd HH:00';
    } else {
      bucketFn = (ts) => ts.startOf('day').toISO();
      labelFormat = 'yyyy-MM-dd';
    }

    const firstPerBucket = getFirstPerBucket(data, bucketFn);

    for (const { bucket, doc } of firstPerBucket) {
      const ts = DateTime.fromISO(bucket, { zone: tz });
      const label = ts.toFormat(labelFormat);
      const isLastHour = ts > endDate.minus({ hours: 1 });

      // skip excluded times only for last hour
      if (isLastHour && excludedTimes.some((ex) => label.endsWith(ex)))
        continue;

      const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
      const returnTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
      const approach =
        typeof returnTemp === 'number' ? returnTemp - wetBulb : 0;

      result.push({
        label,
        approach,
        supplyTemp: supplyTemp ?? 0,
        returnTemp: returnTemp ?? 0,
        wetBulb,
      });
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');
  //   const Cp = 4.186;

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime) {
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );
  //   }

  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 3 Data', rawdata: [] };

  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   for (const field in sampleDoc)
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const result: {
  //     label: string;
  //     coolingCapacity: number;
  //     supplyTemp: number;
  //     returnTemp: number;
  //   }[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastValues = { capacity: 0, supplyTemp: 0, returnTemp: 0 };

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let capacitySum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const flow = doc[`${dto.towerType}_FM_02_FR`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof returnTemp === 'number' &&
  //           typeof supplyTemp === 'number'
  //         ) {
  //           capacitySum += Cp * flow * (returnTemp - supplyTemp);
  //           supplySum += supplyTemp;
  //           returnSum += returnTemp;
  //           count++;
  //         }
  //       }

  //       if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
  //         // carry-forward last known values
  //         result.push({
  //           label,
  //           coolingCapacity: lastValues.capacity,
  //           supplyTemp: lastValues.supplyTemp,
  //           returnTemp: lastValues.returnTemp,
  //         });
  //       } else {
  //         const avgCapacity = count ? capacitySum / count : 0;
  //         const avgSupply = count ? supplySum / count : 0;
  //         const avgReturn = count ? returnSum / count : 0;
  //         result.push({
  //           label,
  //           coolingCapacity: avgCapacity,
  //           supplyTemp: avgSupply,
  //           returnTemp: avgReturn,
  //         });
  //         lastValues = {
  //           capacity: avgCapacity,
  //           supplyTemp: avgSupply,
  //           returnTemp: avgReturn,
  //         };
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const flow = firstDoc[`${dto.towerType}_FM_02_FR`];
  //       const returnTemp = firstDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //       const supplyTemp = firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //       const capacity =
  //         typeof flow === 'number' &&
  //         typeof returnTemp === 'number' &&
  //         typeof supplyTemp === 'number'
  //           ? Cp * flow * (returnTemp - supplyTemp)
  //           : 0;
  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({
  //         label: label25,
  //         coolingCapacity: capacity,
  //         supplyTemp: typeof supplyTemp === 'number' ? supplyTemp : 0,
  //         returnTemp: typeof returnTemp === 'number' ? returnTemp : 0,
  //       });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let capacitySum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const flow = doc[`${dto.towerType}_FM_02_FR`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof returnTemp === 'number' &&
  //           typeof supplyTemp === 'number'
  //         ) {
  //           capacitySum += Cp * flow * (returnTemp - supplyTemp);
  //           supplySum += supplyTemp;
  //           returnSum += returnTemp;
  //           count++;
  //         }
  //       }

  //       const avgCapacity = count ? capacitySum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         coolingCapacity: avgCapacity,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //       });

  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let capacitySum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const flow = doc[`${dto.towerType}_FM_02_FR`];
  //         const returnTemp = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
  //         const supplyTemp = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof returnTemp === 'number' &&
  //           typeof supplyTemp === 'number'
  //         ) {
  //           capacitySum += Cp * flow * (returnTemp - supplyTemp);
  //           supplySum += supplyTemp;
  //           returnSum += returnTemp;
  //           count++;
  //         }
  //       }

  //       const avgCapacity = count ? capacitySum / count : 0;
  //       const avgSupply = count ? supplySum : 0;
  //       const avgReturn = count ? returnSum : 0;
  //       result.push({
  //         label,
  //         coolingCapacity: avgCapacity,
  //         supplyTemp: avgSupply,
  //         returnTemp: avgReturn,
  //       });

  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

  //   return { message: 'Analysis Chart 3 Data', rawdata: result };
  // }

  async getAnalysisDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');
    const Cp = 4.186;

    // --- Determine start & end dates ---
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

      // ✅ Safe conversion to DateTime
      const gteVal = dateRange.$gte as unknown;
      const lteVal = dateRange.$lte as unknown;

      const gteDate =
        gteVal instanceof Date
          ? DateTime.fromJSDate(gteVal, { zone: tz })
          : DateTime.fromISO(String(gteVal), { zone: tz });

      const lteDate =
        lteVal instanceof Date
          ? DateTime.fromJSDate(lteVal, { zone: tz })
          : DateTime.fromISO(String(lteVal), { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- MongoDB filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };

    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 3 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 3 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    const result: {
      label: string;
      coolingCapacity: number;
      supplyTemp: number;
      returnTemp: number;
    }[] = [];

    // --- Excluded times (only for last hour) ---
    const excludedTimes = ['06:15', '06:30', '06:45'];

    // --- Helper: Get first doc per bucket ---
    const getFirstPerBucket = (
      docs: typeof data,
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, (typeof docs)[0]>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key)!.timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Define bucket functions ---
    let bucketFn: (ts: DateTime) => string;
    let labelFormat: string;
    if (interval === '15min') {
      bucketFn = (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO();
      labelFormat = 'yyyy-MM-dd HH:mm';
    } else if (interval === 'hour') {
      bucketFn = (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO();
      labelFormat = 'yyyy-MM-dd HH:00';
    } else {
      bucketFn = (ts) => ts.startOf('day').toISO();
      labelFormat = 'yyyy-MM-dd';
    }

    const firstPerBucket = getFirstPerBucket(data, bucketFn);
    let lastValues = { capacity: 0, supplyTemp: 0, returnTemp: 0 };

    // --- Push to result with last-hour filter ---
    let cursor = startDate;
    while (cursor < endDate) {
      const bucketLabel = cursor.toISO();
      const bucketDoc = firstPerBucket.find(
        (b) => b.bucket === bucketLabel,
      )?.doc;

      let capacity = lastValues.capacity;
      let supplyTemp = lastValues.supplyTemp;
      let returnTemp = lastValues.returnTemp;

      if (bucketDoc) {
        const flow = bucketDoc[`${dto.towerType}_FM_02_FR`];
        const ret = bucketDoc[`${dto.towerType}_TEMP_RTD_02_AI`];
        const sup = bucketDoc[`${dto.towerType}_TEMP_RTD_01_AI`];
        if (
          typeof flow === 'number' &&
          typeof ret === 'number' &&
          typeof sup === 'number'
        ) {
          capacity = Cp * flow * (ret - sup);
          supplyTemp = sup;
          returnTemp = ret;
        }
        lastValues = { capacity, supplyTemp, returnTemp };
      }

      const label = cursor.toFormat(labelFormat);
      const isLastHour = cursor > endDate.minus({ hours: 1 });
      if (!isLastHour || !excludedTimes.some((ex) => label.endsWith(ex))) {
        result.push({
          label,
          coolingCapacity: capacity,
          supplyTemp,
          returnTemp,
        });
      }

      // Move cursor
      if (interval === '15min') cursor = cursor.plus({ minutes: 15 });
      else if (interval === 'hour') cursor = cursor.plus({ hours: 1 });
      else cursor = cursor.plus({ days: 1 });
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 4 Data', rawdata: [] };
  //   const towerPrefix = `${dto.towerType}_`;
  //   for (const field in sampleDoc)
  //     if (field.startsWith(towerPrefix)) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const result: { label: string; returnTemp: number }[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastValue = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let sum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (typeof val === 'number') {
  //           sum += val;
  //           count++;
  //         }
  //       }

  //       const avg = count ? sum / count : lastValue;
  //       result.push({ label, returnTemp: avg });
  //       if (count) lastValue = avg;

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const val =
  //         typeof firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`] === 'number'
  //           ? firstDoc[`${dto.towerType}_TEMP_RTD_01_AI`]
  //           : 0;
  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({ label: label25, returnTemp: val });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let sum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (typeof val === 'number') {
  //           sum += val;
  //           count++;
  //         }
  //       }

  //       result.push({ label, returnTemp: count ? sum / count : 0 });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let sum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const val = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
  //         if (typeof val === 'number') {
  //           sum += val;
  //           count++;
  //         }
  //       }

  //       result.push({ label, returnTemp: count ? sum / count : 0 });
  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    let startDate: DateTime;
    let endDate: DateTime;

    // --- Determine start & end ---
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

      // ✅ Safe, TS-friendly date conversion
      const gteValue = dateRange.$gte as unknown;
      const lteValue = dateRange.$lte as unknown;

      const gteDate =
        gteValue instanceof Date
          ? DateTime.fromJSDate(gteValue, { zone: tz })
          : DateTime.fromISO(String(gteValue), { zone: tz });

      const lteDate =
        lteValue instanceof Date
          ? DateTime.fromJSDate(lteValue, { zone: tz })
          : DateTime.fromISO(String(lteValue), { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
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

    // --- Projection setup ---
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 4 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    for (const field in sampleDoc)
      if (field.startsWith(towerPrefix)) projection[field] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 4 Data', rawdata: [] };

    // --- Interval selection ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    const result: { label: string; returnTemp: number }[] = [];

    // --- Excluded times for the last hour only ---
    const excludedTimes = ['06:15', '06:30', '06:45'];

    // --- Helper: get first doc per bucket ---
    const getFirstPerBucket = (
      docs: typeof data,
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, (typeof docs)[0]>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key)!.timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Push helper with last-hour exclusion ---
    const pushIfValid = (ts: DateTime, temp: number, format: string) => {
      const label = ts.toFormat(format);
      const isLastHour = ts > endDate.minus({ hours: 1 });
      if (!isLastHour || !excludedTimes.some((ex) => label.endsWith(ex))) {
        result.push({
          label,
          returnTemp: typeof temp === 'number' ? temp : 0,
        });
      }
    };

    // --- Interval handling ---
    if (interval === '15min') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const temp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        pushIfValid(ts, temp, 'yyyy-MM-dd HH:mm');
      }
    } else if (interval === 'hour') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const temp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        pushIfValid(ts, temp, 'yyyy-MM-dd HH:00');
      }
    } else if (interval === 'day') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.startOf('day').toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const temp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        pushIfValid(ts, temp, 'yyyy-MM-dd');
      }
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 5 Data', rawdata: [] };
  //   const towerPrefix = `${dto.towerType}_`;
  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //     `${towerPrefix}TEMP_RTD_02_AI`,
  //   ];
  //   for (const field of requiredFields)
  //     if (field in sampleDoc) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 5 Data', rawdata: [] };

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const constant = 0.00085 * 1.8;
  //   const result: {
  //     label: string;
  //     evaporationLoss: number;
  //     supplyTemp: number;
  //     returnTemp: number;
  //   }[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastEvap = 0,
  //       lastSupply = 0,
  //       lastReturn = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let evapSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;

  //       for (const doc of docsInBucket) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           evapSum += constant * flow * (ret - supply);
  //           supplySum += supply;
  //           returnSum += ret;
  //           count++;
  //         }
  //       }

  //       const evap = count ? evapSum / count : lastEvap;
  //       const supply = count ? supplySum / count : lastSupply;
  //       const ret = count ? returnSum / count : lastReturn;

  //       result.push({
  //         label,
  //         evaporationLoss: evap,
  //         supplyTemp: supply,
  //         returnTemp: ret,
  //       });

  //       if (count) {
  //         lastEvap = evap;
  //         lastSupply = supply;
  //         lastReturn = ret;
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: first document only ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const flow = firstDoc[`${towerPrefix}FM_02_FR`];
  //       const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`];
  //       const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`];
  //       const evap =
  //         typeof flow === 'number' &&
  //         typeof supply === 'number' &&
  //         typeof ret === 'number'
  //           ? constant * flow * (ret - supply)
  //           : 0;

  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({
  //         label: label25,
  //         evaporationLoss: evap,
  //         supplyTemp: supply ?? 0,
  //         returnTemp: ret ?? 0,
  //       });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let evapSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           evapSum += constant * flow * (ret - supply);
  //           supplySum += supply;
  //           returnSum += ret;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         supplyTemp: count ? supplySum / count : 0,
  //         returnTemp: count ? returnSum / count : 0,
  //       });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let evapSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           evapSum += constant * flow * (ret - supply);
  //           supplySum += supply;
  //           returnSum += ret;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         supplyTemp: count ? supplySum / count : 0,
  //         returnTemp: count ? returnSum / count : 0,
  //       });
  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    let startDate: DateTime;
    let endDate: DateTime;

    // --- Date setup ---
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

      // ✅ Safe, TS-friendly Date parsing
      const gteValue = dateRange.$gte as unknown;
      const lteValue = dateRange.$lte as unknown;

      const gteDate =
        gteValue instanceof Date
          ? DateTime.fromJSDate(gteValue, { zone: tz })
          : DateTime.fromISO(String(gteValue), { zone: tz });

      const lteDate =
        lteValue instanceof Date
          ? DateTime.fromJSDate(lteValue, { zone: tz })
          : DateTime.fromISO(String(lteValue), { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Mongo filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection setup ---
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 5 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };
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

    // --- Interval logic ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    const constant = 0.00085 * 1.8;
    let result: {
      label: string;
      evaporationLoss: number;
      supplyTemp: number;
      returnTemp: number;
    }[] = [];

    // --- Helper: first document per bucket ---
    const getFirstPerBucket = (
      docs: any[],
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, any>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key).timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Helper: calculate evaporation loss ---
    const calcEvap = (doc: any) => {
      const flow = doc[`${towerPrefix}FM_02_FR`];
      const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
      if (
        typeof flow === 'number' &&
        typeof supply === 'number' &&
        typeof ret === 'number'
      )
        return constant * flow * (ret - supply);
      return 0;
    };

    // --- Exclude 6:15, 6:30, 6:45 only for the *last hour* ---
    const excludedTimes = ['06:15', '06:30', '06:45'];

    const pushIfValid = (
      ts: DateTime,
      evap: number,
      s: number,
      r: number,
      format: string,
    ) => {
      const label = ts.toFormat(format);
      const isLastHour = ts > endDate.minus({ hours: 1 });
      if (!isLastHour || !excludedTimes.some((ex) => label.endsWith(ex))) {
        result.push({
          label,
          evaporationLoss: evap,
          supplyTemp: s ?? 0,
          returnTemp: r ?? 0,
        });
      }
    };

    // --- Interval branches ---
    if (interval === '15min') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const evap = calcEvap(doc);
        const s = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const r = doc[`${towerPrefix}TEMP_RTD_02_AI`];
        pushIfValid(ts, evap, s, r, 'yyyy-MM-dd HH:mm');
      }
    } else if (interval === 'hour') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const evap = calcEvap(doc);
        const s = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const r = doc[`${towerPrefix}TEMP_RTD_02_AI`];
        pushIfValid(ts, evap, s, r, 'yyyy-MM-dd HH:00');
      }
    } else if (interval === 'day') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.startOf('day').toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const evap = calcEvap(doc);
        const s = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const r = doc[`${towerPrefix}TEMP_RTD_02_AI`];
        pushIfValid(ts, evap, s, r, 'yyyy-MM-dd');
      }
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const towerPrefix = `${dto.towerType}_`;
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
  //   if (!sampleDoc) return { message: 'Analysis Chart 6 Data', rawdata: [] };

  //   const requiredFields = [
  //     `${towerPrefix}FM_02_FR`,
  //     `${towerPrefix}TEMP_RTD_01_AI`,
  //   ];
  //   for (const field of requiredFields)
  //     if (field in sampleDoc) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 6 Data', rawdata: [] };

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const result: { label: string; returnTemp: number; driftLoss: number }[] =
  //     [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastReturn = 0,
  //       lastDrift = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let returnSum = 0,
  //         driftSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const flowRate = doc[`${towerPrefix}FM_02_FR`];
  //         const driftLoss =
  //           typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         driftSum += driftLoss;
  //         count++;
  //       }

  //       const ret = count ? returnSum / count : lastReturn;
  //       const drift = count ? driftSum / count : lastDrift;

  //       result.push({ label, returnTemp: ret, driftLoss: drift });

  //       if (count) {
  //         lastReturn = ret;
  //         lastDrift = drift;
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: first document only ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const returnTemp = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
  //       const flowRate = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
  //       const driftLoss = (0.05 * flowRate) / 100;

  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({ label: label25, returnTemp, driftLoss });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let returnSum = 0,
  //         driftSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const flowRate = doc[`${towerPrefix}FM_02_FR`];
  //         const driftLoss =
  //           typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         driftSum += driftLoss;
  //         count++;
  //       }

  //       result.push({
  //         label,
  //         returnTemp: count ? returnSum / count : 0,
  //         driftLoss: count ? driftSum / count : 0,
  //       });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let returnSum = 0,
  //         driftSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const returnTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const flowRate = doc[`${towerPrefix}FM_02_FR`];
  //         const driftLoss =
  //           typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

  //         if (typeof returnTemp === 'number') returnSum += returnTemp;
  //         driftSum += driftLoss;
  //         count++;
  //       }

  //       result.push({
  //         label,
  //         returnTemp: count ? returnSum / count : 0,
  //         driftLoss: count ? driftSum / count : 0,
  //       });
  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start & end ---
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
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else throw new Error('No date range provided');

    // --- Mongo filter ---
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

    // --- Interval ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    let result: { label: string; returnTemp: number; driftLoss: number }[] = [];

    // --- Helper: first doc per bucket ---
    const getFirstPerBucket = (
      docs: any[],
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, any>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key).timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Helper ---
    const calcDriftLoss = (flowRate: number) =>
      typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : 0;

    // --- Build results per interval ---
    if (interval === '15min') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const flow = doc[`${towerPrefix}FM_02_FR`];
        const retTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const drift = calcDriftLoss(flow);
        result.push({
          label: ts.toFormat('yyyy-MM-dd HH:mm'),
          returnTemp: retTemp ?? 0,
          driftLoss: drift ?? 0,
        });
      }
    } else if (interval === 'hour') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const flow = doc[`${towerPrefix}FM_02_FR`];
        const retTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const drift = calcDriftLoss(flow);
        result.push({
          label: ts.toFormat('yyyy-MM-dd HH:00'),
          returnTemp: retTemp ?? 0,
          driftLoss: drift ?? 0,
        });
      }
    } else if (interval === 'day') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.startOf('day').toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        const flow = doc[`${towerPrefix}FM_02_FR`];
        const retTemp = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const drift = calcDriftLoss(flow);
        result.push({
          label: ts.toFormat('yyyy-MM-dd'),
          returnTemp: retTemp ?? 0,
          driftLoss: drift ?? 0,
        });
      }
    }

    // ✅ Apply 06:15, 06:30, 06:45 exclusion only for last hour
    if (interval === '15min' && result.length > 3) {
      const lastLabel = result[result.length - 1].label;
      const lastTime = DateTime.fromFormat(lastLabel, 'yyyy-MM-dd HH:mm', {
        zone: tz,
      });
      if (lastTime.isValid) {
        result = result.filter((r) => {
          const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
            zone: tz,
          });
          if (!ts.isValid) return true;
          // Only exclude inside the last hour window
          if (ts >= lastTime.minus({ hours: 1 }) && ts <= lastTime) {
            return !(ts.hour === 6 && [15, 30, 45].includes(ts.minute));
          }
          return true;
        });
      }
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

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
  //   for (const field of requiredFields)
  //     if (field in sampleDoc) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 7 Data', rawdata: [] };

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const result: {
  //     label: string;
  //     evaporationLoss: number;
  //     blowdownRate: number;
  //   }[] = [];
  //   const constant = 0.00085 * 1.8;

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastEvap = 0,
  //       lastBlow = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           count++;
  //         }
  //       }

  //       const evap = count ? evapSum / count : lastEvap;
  //       const blow = count ? blowSum / count : lastBlow;

  //       result.push({ label, evaporationLoss: evap, blowdownRate: blow });

  //       if (count) {
  //         lastEvap = evap;
  //         lastBlow = blow;
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: first document only ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const flow = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
  //       const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
  //       const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`] ?? 0;
  //       const evapLoss = constant * flow * (ret - supply);
  //       const blowdownRate = evapLoss / 6;

  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({
  //         label: label25,
  //         evaporationLoss: evapLoss,
  //         blowdownRate,
  //       });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         blowdownRate: count ? blowSum / count : 0,
  //       });

  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         blowdownRate: count ? blowSum / count : 0,
  //       });

  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    // --- Determine start & end ---
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
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else throw new Error('No date range provided');

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
    const interval: '15min' | 'hour' | 'day' =
      dto.interval ??
      (diffInDays <= 1 ? '15min' : diffInDays <= 7 ? 'hour' : 'day');

    let result: {
      label: string;
      evaporationLoss: number;
      blowdownRate: number;
    }[] = [];
    const constant = 0.00085 * 1.8;

    // --- Helper to pick first doc per bucket ---
    const getFirstPerBucket = (
      docs: any[],
      bucketFn: (ts: DateTime) => string,
    ) => {
      const map = new Map<string, any>();
      for (const doc of docs) {
        const ts = DateTime.fromISO(doc.timestamp, { zone: tz });
        if (ts < startDate || ts >= endDate) continue;
        const key = bucketFn(ts);
        if (
          !map.has(key) ||
          ts < DateTime.fromISO(map.get(key).timestamp, { zone: tz })
        ) {
          map.set(key, doc);
        }
      }
      return Array.from(map.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([bucket, doc]) => ({ bucket, doc }));
    };

    // --- Interval Logic ---
    const computeBucketResult = (ts: DateTime, doc: any, format: string) => {
      const flow = doc[`${towerPrefix}FM_02_FR`];
      const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
      const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
      const evapLoss =
        typeof flow === 'number' &&
        typeof supply === 'number' &&
        typeof ret === 'number'
          ? constant * flow * (ret - supply)
          : 0;
      const blowdownRate = evapLoss / 6;
      result.push({
        label: ts.toFormat(format),
        evaporationLoss: evapLoss,
        blowdownRate,
      });
    };

    if (interval === '15min') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts
          .startOf('minute')
          .minus({ minutes: ts.minute % 15 })
          .toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        computeBucketResult(ts, doc, 'yyyy-MM-dd HH:mm');
      }
    } else if (interval === 'hour') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.set({ minute: 0, second: 0, millisecond: 0 }).toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        computeBucketResult(ts, doc, 'yyyy-MM-dd HH:00');
      }
    } else if (interval === 'day') {
      const buckets = getFirstPerBucket(data, (ts) =>
        ts.startOf('day').toISO(),
      );
      for (const { bucket, doc } of buckets) {
        const ts = DateTime.fromISO(bucket, { zone: tz });
        computeBucketResult(ts, doc, 'yyyy-MM-dd');
      }
    }

    // ✅ NEW LOGIC: remove 06:15, 06:30, 06:45 only for *last hour*
    if (interval === '15min' && result.length > 3) {
      const lastLabel = result[result.length - 1].label;
      const lastTime = DateTime.fromFormat(lastLabel, 'yyyy-MM-dd HH:mm', {
        zone: tz,
      });
      if (lastTime.isValid) {
        result = result.filter((r) => {
          const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
            zone: tz,
          });
          if (!ts.isValid) return true;
          // Apply filter only inside last hour window
          if (ts >= lastTime.minus({ hours: 1 }) && ts <= lastTime) {
            return !(ts.hour === 6 && [15, 30, 45].includes(ts.minute));
          }
          return true;
        });
      }
    }

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
  //   interval?: '15min' | 'hour' | 'day';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;

  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: 'utc' })
  //       .setZone(tz)
  //       .set({ hour: 6, minute: 0, second: 0 });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- MongoDB filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

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
  //   for (const field of requiredFields)
  //     if (field in sampleDoc) projection[field] = 1;

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 8 Data', rawdata: [] };

  //   // --- Interval selection ---
  //   const diffInDays = endDate.diff(startDate, 'days').days;
  //   const interval: '15min' | 'hour' | 'day' = dto.interval
  //     ? dto.interval
  //     : diffInDays <= 1
  //       ? '15min'
  //       : diffInDays <= 7
  //         ? 'hour'
  //         : 'day';

  //   const result: {
  //     label: string;
  //     evaporationLoss: number;
  //     blowdownRate: number;
  //     driftLoss: number;
  //     makeupWater: number;
  //   }[] = [];
  //   const constant = 0.00085 * 1.8;

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastEvap = 0,
  //       lastBlow = 0,
  //       lastDrift = 0,
  //       lastMakeup = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         driftSum = 0,
  //         makeupSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];

  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           const driftLoss = 0.0005 * flow;
  //           const makeup = evapLoss + blowdownRate + driftLoss;

  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           driftSum += driftLoss;
  //           makeupSum += makeup;
  //           count++;
  //         }
  //       }

  //       const evap = count ? evapSum / count : lastEvap;
  //       const blow = count ? blowSum / count : lastBlow;
  //       const drift = count ? driftSum / count : lastDrift;
  //       const makeup = count ? makeupSum / count : lastMakeup;

  //       result.push({
  //         label,
  //         evaporationLoss: evap,
  //         blowdownRate: blow,
  //         driftLoss: drift,
  //         makeupWater: makeup,
  //       });

  //       if (count) {
  //         lastEvap = evap;
  //         lastBlow = blow;
  //         lastDrift = drift;
  //         lastMakeup = makeup;
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: first document only ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const flow = firstDoc[`${towerPrefix}FM_02_FR`] ?? 0;
  //       const supply = firstDoc[`${towerPrefix}TEMP_RTD_01_AI`] ?? 0;
  //       const ret = firstDoc[`${towerPrefix}TEMP_RTD_02_AI`] ?? 0;
  //       const evapLoss = constant * flow * (ret - supply);
  //       const blowdownRate = evapLoss / 6;
  //       const driftLoss = 0.0005 * flow;
  //       const makeup = evapLoss + blowdownRate + driftLoss;

  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({
  //         label: label25,
  //         evaporationLoss: evapLoss,
  //         blowdownRate,
  //         driftLoss,
  //         makeupWater: makeup,
  //       });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         driftSum = 0,
  //         makeupSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           const driftLoss = 0.0005 * flow;
  //           const makeup = evapLoss + blowdownRate + driftLoss;
  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           driftSum += driftLoss;
  //           makeupSum += makeup;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         blowdownRate: count ? blowSum / count : 0,
  //         driftLoss: count ? driftSum / count : 0,
  //         makeupWater: count ? makeupSum / count : 0,
  //       });

  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   } else if (interval === 'day') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd');
  //       const dayDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ days: 1 });
  //       });

  //       let evapSum = 0,
  //         blowSum = 0,
  //         driftSum = 0,
  //         makeupSum = 0,
  //         count = 0;
  //       for (const doc of dayDocs) {
  //         const flow = doc[`${towerPrefix}FM_02_FR`];
  //         const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
  //         const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
  //         if (
  //           typeof flow === 'number' &&
  //           typeof supply === 'number' &&
  //           typeof ret === 'number'
  //         ) {
  //           const evapLoss = constant * flow * (ret - supply);
  //           const blowdownRate = evapLoss / 6;
  //           const driftLoss = 0.0005 * flow;
  //           const makeup = evapLoss + blowdownRate + driftLoss;
  //           evapSum += evapLoss;
  //           blowSum += blowdownRate;
  //           driftSum += driftLoss;
  //           makeupSum += makeup;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         evaporationLoss: count ? evapSum / count : 0,
  //         blowdownRate: count ? blowSum / count : 0,
  //         driftLoss: count ? driftSum / count : 0,
  //         makeupWater: count ? makeupSum / count : 0,
  //       });

  //       cursor = cursor.plus({ days: 1 });
  //     }
  //   }

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
    interval?: '15min' | 'hour' | 'day';
  }) {
    const tz = 'Asia/Karachi';
    const now = DateTime.now().setZone(tz);
    const todayStr = now.toFormat('yyyy-MM-dd');

    let startDate: DateTime;
    let endDate: DateTime;

    // --- Determine start/end ---
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
      if (endDate > now) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);

      // ✅ Fix TypeScript instanceof issue
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Mongo filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime)
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );

    // --- Projection setup ---
    const towerPrefix = `${dto.towerType}_`;
    const projection: any = { _id: 0, timestamp: 1 };

    const fields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];
    fields.forEach((f) => (projection[f] = 1));

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 8 Data', rawdata: [] };

    // --- Interval logic ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    let result: any[] = [];
    const constant = 0.00085 * 1.8;

    // --- Compute helper ---
    const computeBucket = (start: DateTime, duration: any, fmt: string) => {
      const bucketEnd = start.plus(duration);
      const docs = data.filter((d) => {
        const ts = DateTime.fromISO(d.timestamp, { zone: tz });
        return ts >= start && ts < bucketEnd;
      });
      if (!docs.length) return;

      let evap = 0,
        blow = 0,
        drift = 0,
        makeup = 0,
        count = 0;
      for (const doc of docs) {
        const flow = doc[`${towerPrefix}FM_02_FR`];
        const supply = doc[`${towerPrefix}TEMP_RTD_01_AI`];
        const ret = doc[`${towerPrefix}TEMP_RTD_02_AI`];
        if (
          typeof flow === 'number' &&
          typeof supply === 'number' &&
          typeof ret === 'number'
        ) {
          const evapLoss = constant * flow * (ret - supply);
          const blowdown = evapLoss / 6;
          const driftLoss = 0.0005 * flow;
          const makeupW = evapLoss + blowdown + driftLoss;
          evap += evapLoss;
          blow += blowdown;
          drift += driftLoss;
          makeup += makeupW;
          count++;
        }
      }
      if (!count) return;

      result.push({
        label: start.toFormat(fmt),
        evaporationLoss: evap / count,
        blowdownRate: blow / count,
        driftLoss: drift / count,
        makeupWater: makeup / count,
      });
    };

    // --- Interval loops ---
    if (interval === '15min') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { minutes: 15 }, 'yyyy-MM-dd HH:mm');
        cursor = cursor.plus({ minutes: 15 });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { hours: 1 }, 'yyyy-MM-dd HH:00');
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { days: 1 }, 'yyyy-MM-dd');
        cursor = cursor.plus({ days: 1 });
      }
    }

    // ✅ NEW LOGIC: Only filter 06:15/30/45 for *last hour*, not globally
    if (result.length > 3) {
      const lastHourLabel = result[result.length - 1].label;
      const lastHourTime = DateTime.fromFormat(
        lastHourLabel,
        'yyyy-MM-dd HH:mm',
        { zone: tz },
      );
      if (lastHourTime.isValid && interval === '15min') {
        result = result.filter((r, idx) => {
          const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
            zone: tz,
          });
          if (!ts.isValid) return true;
          // Apply filter only if it's in the last hour window
          if (ts >= lastHourTime.minus({ hours: 1 }) && ts <= lastHourTime) {
            return !(ts.hour === 6 && [15, 30, 45].includes(ts.minute));
          }
          return true;
        });
      }
    }

    return { message: 'Analysis Chart 8 Data', rawdata: result };
  }

  // async getAnalysisDataChart9(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   interval?: '15min' | 'hour';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');
  //   const tower = dto.towerType!;

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   projection[`${tower}_INV_01_SPD_AI`] = 1;
  //   ['Current_AN_Amp', 'Current_BN_Amp', 'Current_CN_Amp'].forEach((s) => {
  //     projection[`${tower}_EM01_${s}`] = 1;
  //   });

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 9 Data', rawdata: [] };

  //   const interval: '15min' | 'hour' = dto.interval ?? 'hour';
  //   const result: any[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastValues = { fanSpeed: 0, fanAmp: 0 };

  //     // --- First 24 hours
  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let speedSum = 0,
  //         ampSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const speed = doc[`${tower}_INV_01_SPD_AI`];
  //         const ampA = doc[`${tower}_EM01_Current_AN_Amp`];
  //         const ampB = doc[`${tower}_EM01_Current_BN_Amp`];
  //         const ampC = doc[`${tower}_EM01_Current_CN_Amp`];
  //         const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
  //           ? (ampA + ampB + ampC) / 3
  //           : null;

  //         if (typeof speed === 'number') speedSum += speed;
  //         if (typeof fanAmp === 'number') ampSum += fanAmp;
  //         count++;
  //       }

  //       if (count === 0 && cursor.toFormat('yyyy-MM-dd') === todayStr) {
  //         result.push({
  //           label,
  //           fanSpeed: lastValues.fanSpeed,
  //           fanAmp: lastValues.fanAmp,
  //         });
  //       } else {
  //         const avgSpeed = count ? speedSum / count : 0;
  //         const avgAmp = count ? ampSum / count : 0;
  //         result.push({ label, fanSpeed: avgSpeed, fanAmp: avgAmp });
  //         lastValues = { fanSpeed: avgSpeed, fanAmp: avgAmp };
  //       }

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const speed = firstDoc[`${tower}_INV_01_SPD_AI`] ?? 0;
  //       const ampA = firstDoc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
  //       const ampB = firstDoc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
  //       const ampC = firstDoc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
  //       const fanAmp = (ampA + ampB + ampC) / 3;

  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({ label: label25, fanSpeed: speed, fanAmp });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let speedSum = 0,
  //         ampSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const speed = doc[`${tower}_INV_01_SPD_AI`];
  //         const ampA = doc[`${tower}_EM01_Current_AN_Amp`];
  //         const ampB = doc[`${tower}_EM01_Current_BN_Amp`];
  //         const ampC = doc[`${tower}_EM01_Current_CN_Amp`];
  //         const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
  //           ? (ampA + ampB + ampC) / 3
  //           : null;

  //         if (typeof speed === 'number') speedSum += speed;
  //         if (typeof fanAmp === 'number') ampSum += fanAmp;
  //         count++;
  //       }

  //       result.push({
  //         label,
  //         fanSpeed: count ? speedSum / count : 0,
  //         fanAmp: count ? ampSum / count : 0,
  //       });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   }

  //   return { message: 'Analysis Chart 9 Data', rawdata: result };
  // }

  async getAnalysisDataChart9(dto: {
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
    const tower = dto.towerType!;

    let startDate: DateTime;
    let endDate: DateTime;

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
      if (endDate > now) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);

      // ✅ Fix TypeScript “instanceof” issue
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Mongo filter ---
    const filter: any = {
      timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
    };
    if (dto.startTime && dto.endTime) {
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // --- Projection setup ---
    const towerPrefix = `${tower}_`;
    const projection: any = { _id: 0, timestamp: 1 };
    [
      `${towerPrefix}INV_01_SPD_AI`,
      `${towerPrefix}EM01_Current_AN_Amp`,
      `${towerPrefix}EM01_Current_BN_Amp`,
      `${towerPrefix}EM01_Current_CN_Amp`,
    ].forEach((f) => (projection[f] = 1));

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 9 Data', rawdata: [] };

    // --- Interval determination ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    let result: any[] = [];

    // --- Compute helper ---
    const computeBucket = (start: DateTime, duration: any, fmt: string) => {
      const bucketEnd = start.plus(duration);
      const docs = data.filter((d) => {
        const ts = DateTime.fromISO(d.timestamp, { zone: tz });
        return ts >= start && ts < bucketEnd;
      });
      if (!docs.length) return;

      let speedSum = 0,
        ampSum = 0,
        count = 0;
      for (const doc of docs) {
        const speed = doc[`${towerPrefix}INV_01_SPD_AI`];
        const ampA = doc[`${towerPrefix}EM01_Current_AN_Amp`];
        const ampB = doc[`${towerPrefix}EM01_Current_BN_Amp`];
        const ampC = doc[`${towerPrefix}EM01_Current_CN_Amp`];
        if (
          typeof speed === 'number' &&
          typeof ampA === 'number' &&
          typeof ampB === 'number' &&
          typeof ampC === 'number'
        ) {
          const fanAmp = (ampA + ampB + ampC) / 3;
          speedSum += speed;
          ampSum += fanAmp;
          count++;
        }
      }

      if (count > 0) {
        result.push({
          label: start.toFormat(fmt),
          fanSpeed: speedSum / count,
          fanAmp: ampSum / count,
        });
      }
    };

    // --- Interval loops ---
    if (interval === '15min') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { minutes: 15 }, 'yyyy-MM-dd HH:mm');
        cursor = cursor.plus({ minutes: 15 });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { hours: 1 }, 'yyyy-MM-dd HH:00');
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { days: 1 }, 'yyyy-MM-dd');
        cursor = cursor.plus({ days: 1 });
      }
    }

    // ✅ Remove 06:15, 06:30, 06:45 only from the *last hour*
    if (result.length > 0) {
      const lastHourLabel = result[result.length - 1].label.split(' ')[0]; // last day's date
      result = result.filter((r, i) => {
        const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
          zone: tz,
        });
        if (!ts.isValid) return true;

        // only apply filter for the last hour (latest day)
        const sameDay = r.label.startsWith(lastHourLabel);
        return !(sameDay && ts.hour === 6 && [15, 30, 45].includes(ts.minute));
      });
    }

    return { message: 'Analysis Chart 9 Data', rawdata: result };
  }

  // async getAnalysisDataChart10(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   interval?: '15min' | 'hour';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');
  //   const tower = dto.towerType!;

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   projection[`${tower}_TEMP_RTD_01_AI`] = 1; // cold
  //   projection[`${tower}_TEMP_RTD_02_AI`] = 1; // hot

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 10 Data', rawdata: [] };

  //   const interval: '15min' | 'hour' = dto.interval ?? 'hour';
  //   const wetBulb = 28;
  //   const ambientAirTemp = 36;
  //   const result: any[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastDelta = 0;

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let deltaSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const hot = doc[`${tower}_TEMP_RTD_02_AI`];
  //         const cold = doc[`${tower}_TEMP_RTD_01_AI`];
  //         if (typeof hot === 'number' && typeof cold === 'number') {
  //           deltaSum += hot - cold;
  //           count++;
  //         }
  //       }

  //       const deltaTemp = count ? deltaSum / count : lastDelta;
  //       if (count) lastDelta = deltaTemp;
  //       result.push({ label, deltaTemp, wetBulb, ambientAirTemp });

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const hot = firstDoc[`${tower}_TEMP_RTD_02_AI`] ?? 0;
  //       const cold = firstDoc[`${tower}_TEMP_RTD_01_AI`] ?? 0;
  //       const deltaTemp = hot - cold;
  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({ label: label25, deltaTemp, wetBulb, ambientAirTemp });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let deltaSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const hot = doc[`${tower}_TEMP_RTD_02_AI`];
  //         const cold = doc[`${tower}_TEMP_RTD_01_AI`];
  //         if (typeof hot === 'number' && typeof cold === 'number') {
  //           deltaSum += hot - cold;
  //           count++;
  //         }
  //       }

  //       result.push({
  //         label,
  //         deltaTemp: count ? deltaSum / count : 0,
  //         wetBulb,
  //         ambientAirTemp,
  //       });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   }

  //   return { message: 'Analysis Chart 10 Data', rawdata: result };
  // }

  async getAnalysisDataChart10(dto: {
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
      if (endDate > now) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
    } else {
      throw new Error('No date range provided');
    }

    // --- Mongo filter ---
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

    // --- Determine interval ---
    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    const wetBulb = 28;
    const ambientAirTemp = 36;
    let result: any[] = [];

    // --- Compute helper ---
    const computeBucket = (start: DateTime, duration: any, fmt: string) => {
      const bucketEnd = start.plus(duration);
      const docs = data.filter((d) => {
        const ts = DateTime.fromISO(d.timestamp, { zone: tz });
        return ts >= start && ts < bucketEnd;
      });
      if (!docs.length) return;

      let deltaSum = 0,
        count = 0;
      for (const doc of docs) {
        const hot = doc[`${tower}_TEMP_RTD_02_AI`];
        const cold = doc[`${tower}_TEMP_RTD_01_AI`];
        if (typeof hot === 'number' && typeof cold === 'number') {
          deltaSum += hot - cold;
          count++;
        }
      }
      if (!count) return;
      const deltaTemp = deltaSum / count;
      result.push({
        label: start.toFormat(fmt),
        deltaTemp,
        wetBulb,
        ambientAirTemp,
      });
    };

    // --- Interval loops ---
    if (interval === '15min') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { minutes: 15 }, 'yyyy-MM-dd HH:mm');
        cursor = cursor.plus({ minutes: 15 });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { hours: 1 }, 'yyyy-MM-dd HH:00');
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { days: 1 }, 'yyyy-MM-dd');
        cursor = cursor.plus({ days: 1 });
      }
    }

    // ✅ Filter 06:15, 06:30, 06:45 only for *last hour*
    if (result.length > 0) {
      const lastLabel = result[result.length - 1].label;
      const lastTime = DateTime.fromFormat(lastLabel, 'yyyy-MM-dd HH:mm', {
        zone: tz,
      });

      result = result.filter((r, idx) => {
        const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
          zone: tz,
        });
        if (!ts.isValid) return true;
        // only remove if in last hour's same date
        const isLastHourSameDay =
          ts.toFormat('yyyy-MM-dd') === lastTime.toFormat('yyyy-MM-dd');
        if (
          isLastHourSameDay &&
          ts.hour === 6 &&
          [15, 30, 45].includes(ts.minute)
        )
          return false;
        return true;
      });
    }

    return { message: 'Analysis Chart 10 Data', rawdata: result };
  }

  // async getAnalysisDataChart11(dto: {
  //   date?: string;
  //   range?: string;
  //   fromDate?: string;
  //   toDate?: string;
  //   startTime?: string;
  //   endTime?: string;
  //   towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //   interval?: '15min' | 'hour';
  // }) {
  //   const tz = 'Asia/Karachi';
  //   const now = DateTime.now().setZone(tz);
  //   const todayStr = now.toFormat('yyyy-MM-dd');
  //   const tower = dto.towerType!;

  //   // --- Determine start and end ---
  //   let startDate: DateTime;
  //   let endDate: DateTime;
  //   if (dto.date) {
  //     startDate = DateTime.fromISO(dto.date, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (dto.date === todayStr) endDate = now;
  //   } else if (dto.fromDate && dto.toDate) {
  //     startDate = DateTime.fromISO(dto.fromDate, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = DateTime.fromISO(dto.toDate, { zone: tz })
  //       .set({ hour: 6, minute: 0, second: 0 })
  //       .plus({ hours: 25 });
  //     if (dto.toDate === todayStr) endDate = now;
  //   } else if (dto.range) {
  //     const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
  //     startDate = DateTime.fromJSDate(dateRange.$gte, { zone: tz }).set({
  //       hour: 6,
  //       minute: 0,
  //       second: 0,
  //     });
  //     endDate = startDate.plus({ hours: 25 });
  //     if (startDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
  //   } else {
  //     throw new Error('No date range provided');
  //   }

  //   // --- Filter ---
  //   const filter: any = {
  //     timestamp: { $gte: startDate.toISO(), $lt: endDate.toISO() },
  //   };
  //   if (dto.startTime && dto.endTime)
  //     Object.assign(
  //       filter,
  //       this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
  //     );

  //   // --- Projection ---
  //   const projection: any = { _id: 0, timestamp: 1 };
  //   [
  //     'EM01_Current_AN_Amp',
  //     'EM01_Current_BN_Amp',
  //     'EM01_Current_CN_Amp',
  //   ].forEach((s) => {
  //     projection[`${tower}_${s}`] = 1;
  //   });
  //   projection[`${tower}_TEMP_RTD_01_AI`] = 1; // supply
  //   projection[`${tower}_TEMP_RTD_02_AI`] = 1; // return

  //   const data = await this.AnalysisModel.find(filter, projection)
  //     .lean()
  //     .exec();
  //   if (!data.length) return { message: 'Analysis Chart 11 Data', rawdata: [] };

  //   const interval: '15min' | 'hour' = dto.interval ?? 'hour';
  //   const result: any[] = [];

  //   if (interval === '15min') {
  //     const cursorEnd24h = startDate.plus({ hours: 24 });
  //     let cursor = startDate;
  //     let lastValues = { fanPower: 0, supplyTemp: 0, returnTemp: 0 };

  //     while (cursor < cursorEnd24h && cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       const docsInBucket = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ minutes: 15 });
  //       });

  //       let powerSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of docsInBucket) {
  //         const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
  //         const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
  //         const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
  //         const avgPower = (an + bn + cn) / 3;
  //         powerSum += avgPower;

  //         const supply = doc[`${tower}_TEMP_RTD_01_AI`];
  //         const ret = doc[`${tower}_TEMP_RTD_02_AI`];
  //         if (typeof supply === 'number') supplySum += supply;
  //         if (typeof ret === 'number') returnSum += ret;
  //         count++;
  //       }

  //       const fanPower = count ? powerSum / count : lastValues.fanPower;
  //       const supplyTemp = count ? supplySum / count : lastValues.supplyTemp;
  //       const returnTemp = count ? returnSum / count : lastValues.returnTemp;

  //       result.push({ label, fanPower, supplyTemp, returnTemp });
  //       lastValues = { fanPower, supplyTemp, returnTemp };

  //       cursor = cursor.plus({ minutes: 15 });
  //     }

  //     // --- 25th hour: only first document ---
  //     if (data.length > 0 && cursor < endDate) {
  //       const firstDoc = data[0];
  //       const an = firstDoc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
  //       const bn = firstDoc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
  //       const cn = firstDoc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
  //       const fanPower = (an + bn + cn) / 3;
  //       const supplyTemp = firstDoc[`${tower}_TEMP_RTD_01_AI`] ?? 0;
  //       const returnTemp = firstDoc[`${tower}_TEMP_RTD_02_AI`] ?? 0;
  //       const label25 = cursor.toFormat('yyyy-MM-dd HH:mm');
  //       result.push({ label: label25, fanPower, supplyTemp, returnTemp });
  //     }
  //   } else if (interval === 'hour') {
  //     let cursor = startDate;
  //     while (cursor < endDate) {
  //       const label = cursor.toFormat('yyyy-MM-dd HH:00');
  //       const hourDocs = data.filter((d) => {
  //         const ts = DateTime.fromISO(d.timestamp, { zone: tz });
  //         return ts >= cursor && ts < cursor.plus({ hours: 1 });
  //       });

  //       let powerSum = 0,
  //         supplySum = 0,
  //         returnSum = 0,
  //         count = 0;
  //       for (const doc of hourDocs) {
  //         const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
  //         const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
  //         const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
  //         powerSum += (an + bn + cn) / 3;

  //         const supply = doc[`${tower}_TEMP_RTD_01_AI`];
  //         const ret = doc[`${tower}_TEMP_RTD_02_AI`];
  //         if (typeof supply === 'number') supplySum += supply;
  //         if (typeof ret === 'number') returnSum += ret;
  //         count++;
  //       }

  //       result.push({
  //         label,
  //         fanPower: count ? powerSum / count : 0,
  //         supplyTemp: count ? supplySum / count : 0,
  //         returnTemp: count ? returnSum / count : 0,
  //       });
  //       cursor = cursor.plus({ hours: 1 });
  //     }
  //   }

  //   return { message: 'Analysis Chart 11 Data', rawdata: result };
  // }

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

  async getAnalysisDataChart11(dto: {
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
      if (endDate > now) endDate = now;
    } else if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      const gteDate =
        typeof dateRange.$gte === 'string'
          ? DateTime.fromISO(dateRange.$gte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$gte as Date, { zone: tz });
      const lteDate =
        typeof dateRange.$lte === 'string'
          ? DateTime.fromISO(dateRange.$lte, { zone: tz })
          : DateTime.fromJSDate(dateRange.$lte as Date, { zone: tz });

      startDate = gteDate.set({ hour: 6, minute: 0, second: 0 });
      endDate = lteDate
        .set({ hour: 6, minute: 0, second: 0 })
        .plus({ hours: 25 });
      if (lteDate.toFormat('yyyy-MM-dd') === todayStr) endDate = now;
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
    projection[`${tower}_TEMP_RTD_01_AI`] = 1;
    projection[`${tower}_TEMP_RTD_02_AI`] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 11 Data', rawdata: [] };

    const diffInDays = endDate.diff(startDate, 'days').days;
    const interval: '15min' | 'hour' | 'day' = dto.interval
      ? dto.interval
      : diffInDays <= 1
        ? '15min'
        : diffInDays <= 7
          ? 'hour'
          : 'day';

    let result: any[] = [];

    const computeBucket = (start: DateTime, duration: any, fmt: string) => {
      const bucketEnd = start.plus(duration);
      const docs = data.filter((d) => {
        const ts = DateTime.fromISO(d.timestamp, { zone: tz });
        return ts >= start && ts < bucketEnd;
      });
      if (!docs.length) return;

      let powerSum = 0,
        supplySum = 0,
        returnSum = 0,
        count = 0;

      for (const doc of docs) {
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

      if (!count) return;
      result.push({
        label: start.toFormat(fmt),
        fanPower: powerSum / count,
        supplyTemp: supplySum / count,
        returnTemp: returnSum / count,
      });
    };

    // --- Interval loops ---
    if (interval === '15min') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { minutes: 15 }, 'yyyy-MM-dd HH:mm');
        cursor = cursor.plus({ minutes: 15 });
      }
    } else if (interval === 'hour') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { hours: 1 }, 'yyyy-MM-dd HH:00');
        cursor = cursor.plus({ hours: 1 });
      }
    } else if (interval === 'day') {
      let cursor = startDate;
      while (cursor < endDate) {
        computeBucket(cursor, { days: 1 }, 'yyyy-MM-dd');
        cursor = cursor.plus({ days: 1 });
      }
    }

    // ✅ Remove 06:15, 06:30, 06:45 only from the *last hour* (not globally)
    if (result.length > 0) {
      const lastHourLabel = result[result.length - 1].label.split(' ')[0]; // last day date
      result = result.filter((r) => {
        const ts = DateTime.fromFormat(r.label, 'yyyy-MM-dd HH:mm', {
          zone: tz,
        });
        if (!ts.isValid) return true;
        const sameDay = r.label.startsWith(lastHourLabel);
        return !(sameDay && ts.hour === 6 && [15, 30, 45].includes(ts.minute));
      });
    }

    return { message: 'Analysis Chart 11 Data', rawdata: result };
  }
}
