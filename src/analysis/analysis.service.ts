import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { format, getWeek, getYear } from 'date-fns';
import { AnalysisData } from './schemas/analysis.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
import { AnalysisTowerDataProcessor } from 'src/helpers/analysistowerdataformulating-utils';
import * as moment from 'moment-timezone';
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
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 1, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return { message: 'Analysis Chart 1 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

    const wetBulb = 28;

    // Step 1: Generate empty buckets
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    // Step 2: Group data
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
      const docDate = new Date(doc.timestamp);

      const label = (() => {
        switch (groupBy) {
          case 'hour':
            return format(docDate, 'yyyy-MM-dd HH:00');
          case 'day':
            return format(docDate, 'yyyy-MM-dd');
        }
      })();

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

    // Step 3: Merge buckets
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        coolingEfficiency: count > 0 ? group!.efficiencySum / count : 0,
        supplyTemp: count > 0 ? group!.supplySum / count : 0,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
        wetBulb,
      };
    });

    return {
      message: 'Analysis Chart 1 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    wetBulb?: number; // pass this as argument or use a default
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 1, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return { message: 'Analysis Chart 2 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

    // Use provided wetBulb or default
    const wetBulb = dto.wetBulb ?? 28;

    // Step 1: Generate empty buckets
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    // Step 2: Group data by period
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
      const docDate = new Date(doc.timestamp);

      const label = (() => {
        switch (groupBy) {
          case 'hour':
            return format(docDate, 'yyyy-MM-dd HH:00');
          case 'day':
            return format(docDate, 'yyyy-MM-dd');
        }
      })();

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

      // Approach = ReturnTemp - WetBulb
      const approach =
        typeof returnTemp === 'number' ? returnTemp - wetBulb : null;

      if (approach !== null) group.approachSum += approach;
      if (typeof supplyTemp === 'number') group.supplySum += supplyTemp;
      if (typeof returnTemp === 'number') group.returnSum += returnTemp;
      group.count++;
    }

    // Step 3: Map groups into result array
    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        approach: count > 0 ? group!.approachSum / count : 0,
        supplyTemp: count > 0 ? group!.supplySum / count : 0,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
        wetBulb,
      };
    });

    return {
      message: 'Analysis Chart 2 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    // Date filtering
    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else {
      throw new Error('No date range provided');
    }

    // Time filtering
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    const projection: any = { _id: 1, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 2 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

    const Cp = 4.186; // kJ/kg°C

    // Step 1: Generate empty buckets
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    // Step 2: Group data
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
      const docDate = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(docDate, 'yyyy-MM-dd HH:00')
          : format(docDate, 'yyyy-MM-dd');

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
        const capacity = Cp * flow * (returnTemp - supplyTemp); // Cooling Capacity
        group.capacitySum += capacity;
        group.supplySum += supplyTemp;
        group.returnSum += returnTemp;
        group.count++;
      }
    }

    // Step 3: Merge buckets
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

    return {
      message: 'Analysis Chart 2 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 1, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return { message: 'Analysis Chart 4 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';

    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    const groupMap = new Map<
      string,
      {
        returnSum: number;
        count: number;
      }
    >();

    for (const doc of data) {
      const docDate = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(docDate, 'yyyy-MM-dd HH:00')
          : format(docDate, 'yyyy-MM-dd');

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          returnSum: 0,
          count: 0,
        });
      }

      const group = groupMap.get(label)!;

      const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];
      if (typeof cold === 'number') group.returnSum += cold;

      group.count++;
    }

    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count || 0;
      return {
        label: timestamp,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
      };
    });

    return {
      message: 'Analysis Chart 4 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    // Date filtering
    if (dto.range) {
      const range = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const range = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.date) {
      const range = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else {
      throw new Error('No date range provided');
    }

    // Time filtering
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // Dynamic projection setup
    const sample = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sample) {
      return { message: 'Analysis Chart 5 Data', rawdata: [] };
    }

    const towerPrefix = `${dto.towerType}_`;
    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];

    const projection: any = { timestamp: 1 };
    for (const key of requiredFields) {
      if (key in sample) projection[key] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 5 Data', rawdata: [] };

    const groupBy: 'hour' | 'day' =
      endDate.getTime() - startDate.getTime() <= 86400000 ? 'hour' : 'day';

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
      const timestamp = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(timestamp, 'yyyy-MM-dd HH:00')
          : format(timestamp, 'yyyy-MM-dd');

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

    // Fill missing buckets
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

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

    return {
      message: 'Analysis Chart 5 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    // Date Filtering
    if (dto.range) {
      const { $gte, $lte } = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte, $lte };
      startDate = new Date($gte);
      endDate = new Date($lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const { $gte, $lte } = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte, $lte };
      startDate = new Date($gte);
      endDate = new Date($lte);
    } else if (dto.date) {
      const { $gte, $lte } = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte, $lte };
      startDate = new Date($gte);
      endDate = new Date($lte);
    } else {
      throw new Error('No valid date range provided');
    }

    // Time Filtering (Optional)
    if (dto.startTime && dto.endTime) {
      Object.assign(
        filter,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // Tower prefix
    const prefix = dto.towerType + '_';

    // Project only required fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) {
      return { message: 'Analysis Chart 6 Data', rawdata: [] };
    }

    const projection: Record<string, 1> = { _id: 1, timestamp: 1 };
    for (const key in sampleDoc) {
      if (key.startsWith(prefix)) {
        projection[key] = 1;
      }
    }

    const docs = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    const diffInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const groupBy: 'hour' | 'day' = diffInDays <= 1 ? 'hour' : 'day';
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    // Grouping logic
    const groupMap = new Map<
      string,
      { returnSum: number; driftSum: number; count: number }
    >();

    for (const doc of docs) {
      const docDate = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(docDate, 'yyyy-MM-dd HH:00')
          : format(docDate, 'yyyy-MM-dd');

      if (!groupMap.has(label)) {
        groupMap.set(label, { returnSum: 0, driftSum: 0, count: 0 });
      }

      const group = groupMap.get(label)!;
      const returnTemp = doc[`${prefix}TEMP_RTD_01_AI`];
      const flowRate = doc[`${prefix}FM_02_FR`];

      const driftLoss =
        typeof flowRate === 'number' ? (0.05 * flowRate) / 100 : null;

      if (typeof returnTemp === 'number') group.returnSum += returnTemp;
      if (typeof driftLoss === 'number') group.driftSum += driftLoss;
      group.count++;
    }

    const result = emptyBuckets.map(({ timestamp }) => {
      const group = groupMap.get(timestamp);
      const count = group?.count ?? 0;
      return {
        label: timestamp,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
        driftLoss: count > 0 ? group!.driftSum / count : 0,
      };
    });

    return {
      message: 'Analysis Chart 6 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    // Date filtering
    if (dto.range) {
      const range = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const range = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.date) {
      const range = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else {
      throw new Error('No date range provided');
    }

    // Time filtering
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    const sample = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sample) return { message: 'Analysis Chart 7 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];

    const projection: any = { timestamp: 1 };
    for (const key of requiredFields) {
      if (key in sample) projection[key] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 7 Data', rawdata: [] };

    const groupBy: 'hour' | 'day' =
      endDate.getTime() - startDate.getTime() <= 86400000 ? 'hour' : 'day';

    const groupMap = new Map<
      string,
      { blowdownSum: number; evapSum: number; count: number }
    >();
    const constant = 0.00085 * 1.8;

    for (const doc of data) {
      const timestamp = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(timestamp, 'yyyy-MM-dd HH:00')
          : format(timestamp, 'yyyy-MM-dd');

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

    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );

    const result = emptyBuckets.map(({ timestamp }) => {
      const g = groupMap.get(timestamp);
      const count = g?.count || 0;
      return {
        label: timestamp,
        evaporationLoss: count ? g!.evapSum / count : 0,
        blowdownRate: count ? g!.blowdownSum / count : 0,
      };
    });

    return {
      message: 'Analysis Chart 7 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const range = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const range = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
    } else if (dto.date) {
      const range = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: range.$gte, $lte: range.$lte };
      startDate = new Date(range.$gte);
      endDate = new Date(range.$lte);
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

    const sample = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sample) return { message: 'Analysis Chart 8 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    const requiredFields = [
      `${towerPrefix}FM_02_FR`,
      `${towerPrefix}TEMP_RTD_01_AI`,
      `${towerPrefix}TEMP_RTD_02_AI`,
    ];

    const projection: any = { timestamp: 1 };
    for (const key of requiredFields) {
      if (key in sample) projection[key] = 1;
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();
    if (!data.length) return { message: 'Analysis Chart 8 Data', rawdata: [] };

    const groupBy: 'hour' | 'day' =
      endDate.getTime() - startDate.getTime() <= 86400000 ? 'hour' : 'day';
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
      const timestamp = new Date(doc.timestamp);
      const label =
        groupBy === 'hour'
          ? format(timestamp, 'yyyy-MM-dd HH:00')
          : format(timestamp, 'yyyy-MM-dd');

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

    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    );
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

    return {
      message: 'Analysis Chart 8 Data',
      rawdata: result,
    };
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
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 0, timestamp: 1 };
    const ampFields = ['Current_AN_Amp', 'Current_BN_Amp', 'Current_CN_Amp'];
    const speedField = `${dto.towerType}_INV_01_SPD_AI`;

    ampFields.forEach((suffix) => {
      projection[`${dto.towerType}_EM01_${suffix}`] = 1;
    });
    projection[speedField] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const interval = dto.interval ?? 'hour'; // default hour

    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      interval,
    );

    const groupMap = new Map<
      string,
      { fanSpeedSum: number; fanAmpSum: number; count: number }
    >();

    for (const doc of data) {
      const ts = new Date(doc.timestamp);
      let label: string;
      if (interval === 'hour') {
        label = format(ts, 'yyyy-MM-dd HH:00');
      } else {
        // 15min interval rounding
        const minutes = ts.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        label = format(
          ts,
          `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
        );
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, { fanSpeedSum: 0, fanAmpSum: 0, count: 0 });
      }

      const group = groupMap.get(label)!;

      const speed = doc[speedField];
      const ampA = doc[`${dto.towerType}_EM01_Current_AN_Amp`];
      const ampB = doc[`${dto.towerType}_EM01_Current_BN_Amp`];
      const ampC = doc[`${dto.towerType}_EM01_Current_CN_Amp`];

      const fanAmp = [ampA, ampB, ampC].every((a) => typeof a === 'number')
        ? (ampA + ampB + ampC) / 3
        : null;

      if (typeof speed === 'number') group.fanSpeedSum += speed;
      if (typeof fanAmp === 'number') group.fanAmpSum += fanAmp;
      group.count++;
    }

    const result = emptyBuckets.map(({ timestamp }) => {
      const label = (() => {
        const ts = new Date(timestamp);
        if (interval === 'hour') {
          return format(ts, 'yyyy-MM-dd HH:00');
        } else {
          const minutes = ts.getMinutes();
          const roundedMinutes = Math.floor(minutes / 15) * 15;
          return format(
            ts,
            `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
          );
        }
      })();

      const group = groupMap.get(label);
      const count = group?.count || 0;

      return {
        label,
        fanSpeed: count > 0 ? group!.fanSpeedSum / count : 0,
        fanAmpere: count > 0 ? group!.fanAmpSum / count : 0,
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
    interval?: '15min' | 'hour'; // NEW param
  }) {
    const filter: any = {};
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 1, timestamp: 1 };
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();
    if (!sampleDoc) return { message: 'Analysis Chart 10 Data', rawdata: [] };

    const towerPrefix = `${dto.towerType}_`;
    for (const field in sampleDoc) {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    }

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    // Use interval param with default to 'hour'
    const interval = dto.interval ?? 'hour';

    // Generate empty buckets based on interval (15min or hour)
    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      interval,
    );

    const wetBulb = 28; // static
    const ambientAirTemp = 36; // static

    const groupMap = new Map<string, { deltaTempSum: number; count: number }>();

    for (const doc of data) {
      const docDate = new Date(doc.timestamp);

      let label: string;
      if (interval === 'hour') {
        label = format(docDate, 'yyyy-MM-dd HH:00');
      } else {
        // 15min interval rounding
        const minutes = docDate.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        label = format(
          docDate,
          `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
        );
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, { deltaTempSum: 0, count: 0 });
      }

      const group = groupMap.get(label)!;
      const hot = doc[`${dto.towerType}_TEMP_RTD_02_AI`];
      const cold = doc[`${dto.towerType}_TEMP_RTD_01_AI`];

      if (typeof hot === 'number' && typeof cold === 'number') {
        group.deltaTempSum += hot - cold;
        group.count++;
      }
    }

    const result = emptyBuckets.map(({ timestamp }) => {
      // Normalize timestamp label to match group keys for 15min or hour
      const tsDate = new Date(timestamp);
      let label: string;
      if (interval === 'hour') {
        label = format(tsDate, 'yyyy-MM-dd HH:00');
      } else {
        const minutes = tsDate.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        label = format(
          tsDate,
          `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
        );
      }

      const group = groupMap.get(label);
      const count = group?.count || 0;
      return {
        label: timestamp,
        deltaTemp: count > 0 ? group!.deltaTempSum / count : 0,
        wetBulb,
        ambientAirTemp,
      };
    });

    return {
      message: 'Analysis Chart 10 Data',
      rawdata: result,
    };
  }

  async getAnalysisDataChart11(dto: {
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
    let startDate: Date;
    let endDate: Date;

    if (dto.range) {
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.fromDate && dto.toDate) {
      const from = moment
        .tz(dto.fromDate, 'Asia/Karachi')
        .startOf('day')
        .toDate();
      const to = moment.tz(dto.toDate, 'Asia/Karachi').endOf('day').toDate();
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
    } else if (dto.date) {
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = { $gte: dateRange.$gte, $lte: dateRange.$lte };
      startDate = new Date(dateRange.$gte);
      endDate = new Date(dateRange.$lte);
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

    const projection: any = { _id: 0, timestamp: 1 };
    const tower = dto.towerType!;

    // Fan currents
    projection[`${tower}_EM01_Current_AN_Amp`] = 1;
    projection[`${tower}_EM01_Current_BN_Amp`] = 1;
    projection[`${tower}_EM01_Current_CN_Amp`] = 1;

    // Corrected supply & return temp fields to match DB tags
    projection[`${tower}_TEMP_RTD_01_AI`] = 1;
    projection[`${tower}_TEMP_RTD_02_AI`] = 1;

    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    const interval = dto.interval ?? 'hour';

    const emptyBuckets = AnalysisTowerDataProcessor.generateEmptyBuckets(
      startDate,
      endDate,
      interval,
    );

    const groupMap = new Map<
      string,
      { powerSum: number; supplySum: number; returnSum: number; count: number }
    >();

    for (const doc of data) {
      const docDate = new Date(doc.timestamp);

      let label: string;
      if (interval === 'hour') {
        label = format(docDate, 'yyyy-MM-dd HH:00');
      } else {
        const minutes = docDate.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        label = format(
          docDate,
          `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
        );
      }

      if (!groupMap.has(label)) {
        groupMap.set(label, {
          powerSum: 0,
          supplySum: 0,
          returnSum: 0,
          count: 0,
        });
      }

      const group = groupMap.get(label)!;

      const an = doc[`${tower}_EM01_Current_AN_Amp`] ?? 0;
      const bn = doc[`${tower}_EM01_Current_BN_Amp`] ?? 0;
      const cn = doc[`${tower}_EM01_Current_CN_Amp`] ?? 0;
      const avgPower = (an + bn + cn) / 3;

      const supplyTemp = doc[`${tower}_TEMP_RTD_01_AI`];
      const returnTemp = doc[`${tower}_TEMP_RTD_02_AI`];

      group.powerSum += avgPower;
      if (typeof supplyTemp === 'number') group.supplySum += supplyTemp;
      if (typeof returnTemp === 'number') group.returnSum += returnTemp;
      group.count++;
    }

    const result = emptyBuckets.map(({ timestamp }) => {
      const tsDate = new Date(timestamp);
      let label: string;
      if (interval === 'hour') {
        label = format(tsDate, 'yyyy-MM-dd HH:00');
      } else {
        const minutes = tsDate.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        label = format(
          tsDate,
          `yyyy-MM-dd HH:${roundedMinutes.toString().padStart(2, '0')}`,
        );
      }

      const group = groupMap.get(label);
      const count = group?.count || 0;

      return {
        label: timestamp,
        fanPower: count > 0 ? group!.powerSum / count : 0,
        supplyTemp: count > 0 ? group!.supplySum / count : 0,
        returnTemp: count > 0 ? group!.returnSum / count : 0,
      };
    });

    return {
      message: 'Analysis Chart 11 Data',
      rawdata: result,
    };
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
