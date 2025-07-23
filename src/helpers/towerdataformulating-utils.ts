// towerdataformulating-utils.ts
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  differenceInDays,
  differenceInMonths,
  format,
  getWeek,
  getYear,
  startOfDay,
  startOfHour,
} from 'date-fns';

export class TowerDataProcessor {
  static calculateRange(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    // Generate empty buckets for the entire range
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({ label: bucket.timestamp, value: 0 }));

    // If no data, return empty buckets
    if (data.length === 0) {
      return {
        grouped: emptyBuckets,
        overallAverage: 0,
      };
    }

    // Helper to extract date from document
    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) {
        return new Date(doc.timestamp.$date);
      }
      if (typeof doc.timestamp === 'string') {
        return new Date(doc.timestamp);
      }
      if (doc.Time) {
        return new Date(doc.Time);
      }
      if (doc.UNIXtimestamp) {
        return new Date(doc.UNIXtimestamp * 1000);
      }
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    // Calculate range value for a document
    const calculateDocumentRange = (doc: any): number | null => {
      const ranges: number[] = [];

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          ranges.push(doc.CHCT1_TEMP_RTD_02_AI - doc.CHCT1_TEMP_RTD_01_AI);
        }
        if (
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          ranges.push(doc.CHCT2_TEMP_RTD_02_AI - doc.CHCT2_TEMP_RTD_01_AI);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          ranges.push(doc.CT1_TEMP_RTD_02_AI - doc.CT1_TEMP_RTD_01_AI);
        }
        if (
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          ranges.push(doc.CT2_TEMP_RTD_02_AI - doc.CT2_TEMP_RTD_01_AI);
        }
      }

      return ranges.length > 0
        ? ranges.reduce((a, b) => a + b, 0) / ranges.length
        : null;
    };

    // Group data by time period
    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docRange = calculateDocumentRange(doc);
      if (docRange === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docRange;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }
      const group = groupMap.get(groupKey)!;
      group.sum += docRange;
      group.count++;
    }

    // Fill buckets with actual data
    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static calculateApproach(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    wetBulb: number, // static value
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({
      label: bucket.timestamp,
      value: 0,
    }));

    if (data.length === 0) {
      return {
        grouped: emptyBuckets,
        overallAverage: 0,
      };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentApproach = (doc: any): number | null => {
      const approaches: number[] = [];

      if (towerType === 'CHCT' || towerType === 'all') {
        if (typeof doc.CHCT1_TEMP_RTD_01_AI === 'number') {
          approaches.push(doc.CHCT1_TEMP_RTD_01_AI - wetBulb);
        }
        if (typeof doc.CHCT2_TEMP_RTD_01_AI === 'number') {
          approaches.push(doc.CHCT2_TEMP_RTD_01_AI - wetBulb);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (typeof doc.CT1_TEMP_RTD_01_AI === 'number') {
          approaches.push(doc.CT1_TEMP_RTD_01_AI - wetBulb);
        }
        if (typeof doc.CT2_TEMP_RTD_01_AI === 'number') {
          approaches.push(doc.CT2_TEMP_RTD_01_AI - wetBulb);
        }
      }

      return approaches.length > 0
        ? approaches.reduce((a, b) => a + b, 0) / approaches.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docApproach = calculateDocumentApproach(doc);
      if (docApproach === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docApproach;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }
      const group = groupMap.get(groupKey)!;
      group.sum += docApproach;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static calculateCoolingEfficiency(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    wetBulb: number,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({
      label: bucket.timestamp,
      value: 0,
    }));

    if (data.length === 0) {
      return {
        grouped: emptyBuckets,
        overallAverage: 0,
      };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentEfficiency = (doc: any): number | null => {
      const efficiencies: number[] = [];

      const calc = (hot: number, cold: number): number | null => {
        const denom = hot - wetBulb;
        if (
          typeof hot === 'number' &&
          typeof cold === 'number' &&
          denom !== 0
        ) {
          return ((hot - cold) / denom) * 100;
        }
        return null;
      };

      if (towerType === 'CHCT' || towerType === 'all') {
        const e1 = calc(doc.CHCT1_TEMP_RTD_02_AI, doc.CHCT1_TEMP_RTD_01_AI);
        const e2 = calc(doc.CHCT2_TEMP_RTD_02_AI, doc.CHCT2_TEMP_RTD_01_AI);
        if (e1 !== null) efficiencies.push(e1);
        if (e2 !== null) efficiencies.push(e2);
      }

      if (towerType === 'CT' || towerType === 'all') {
        const e1 = calc(doc.CT1_TEMP_RTD_02_AI, doc.CT1_TEMP_RTD_01_AI);
        const e2 = calc(doc.CT2_TEMP_RTD_02_AI, doc.CT2_TEMP_RTD_01_AI);
        if (e1 !== null) efficiencies.push(e1);
        if (e2 !== null) efficiencies.push(e2);
      }

      return efficiencies.length > 0
        ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docEff = calculateDocumentEfficiency(doc);
      if (docEff === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docEff;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += docEff;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static calculateFanSpeed(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({
      label: bucket.timestamp,
      value: 0,
    }));

    if (data.length === 0) {
      return {
        grouped: emptyBuckets,
        overallAverage: 0,
      };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentFanSpeed = (doc: any): number | null => {
      const speeds: number[] = [];

      if (towerType === 'CHCT' || towerType === 'all') {
        if (typeof doc.CHCT1_INV_01_SPD_AI === 'number') {
          speeds.push(doc.CHCT1_INV_01_SPD_AI);
        }
        if (typeof doc.CHCT2_INV_01_SPD_AI === 'number') {
          speeds.push(doc.CHCT2_INV_01_SPD_AI);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (typeof doc.CT1_INV_01_SPD_AI === 'number') {
          speeds.push(doc.CT1_INV_01_SPD_AI);
        }
        if (typeof doc.CT2_INV_01_SPD_AI === 'number') {
          speeds.push(doc.CT2_INV_01_SPD_AI);
        }
      }

      return speeds.length > 0
        ? speeds.reduce((a, b) => a + b, 0) / speeds.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docSpeed = calculateDocumentFanSpeed(doc);
      if (docSpeed === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docSpeed;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += docSpeed;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static calculateDriftLossRate(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({ label: bucket.timestamp, value: 0 }));

    if (data.length === 0) {
      return {
        grouped: emptyBuckets,
        overallAverage: 0,
      };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentDriftLoss = (doc: any): number | null => {
      const losses: number[] = [];

      if (towerType === 'CHCT' || towerType === 'all') {
        if (typeof doc.CHCT1_FM_02_FR === 'number') {
          losses.push((0.05 * doc.CHCT1_FM_02_FR) / 100);
        }
        if (typeof doc.CHCT2_FM_02_FR === 'number') {
          losses.push((0.05 * doc.CHCT2_FM_02_FR) / 100);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (typeof doc.CT1_FM_02_FR === 'number') {
          losses.push((0.05 * doc.CT1_FM_02_FR) / 100);
        }
        if (typeof doc.CT2_FM_02_FR === 'number') {
          losses.push((0.05 * doc.CT2_FM_02_FR) / 100);
        }
      }

      return losses.length > 0
        ? losses.reduce((a, b) => a + b, 0) / losses.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docLoss = calculateDocumentDriftLoss(doc);
      if (docLoss === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docLoss;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += docLoss;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static calculateEvaporationLossRate(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({ label: bucket.timestamp, value: 0 }));

    if (data.length === 0) {
      return { grouped: emptyBuckets, overallAverage: 0 };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentEvapLoss = (doc: any): number | null => {
      const losses: number[] = [];
      const constant = 0.00085 * 1.8;

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          losses.push(
            constant *
              doc.CHCT1_FM_02_FR *
              (doc.CHCT1_TEMP_RTD_02_AI - doc.CHCT1_TEMP_RTD_01_AI),
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          losses.push(
            constant *
              doc.CHCT2_FM_02_FR *
              (doc.CHCT2_TEMP_RTD_02_AI - doc.CHCT2_TEMP_RTD_01_AI),
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          losses.push(
            constant *
              doc.CT1_FM_02_FR *
              (doc.CT1_TEMP_RTD_02_AI - doc.CT1_TEMP_RTD_01_AI),
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          losses.push(
            constant *
              doc.CT2_FM_02_FR *
              (doc.CT2_TEMP_RTD_02_AI - doc.CT2_TEMP_RTD_01_AI),
          );
        }
      }

      return losses.length > 0
        ? losses.reduce((a, b) => a + b, 0) / losses.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const loss = calculateDocumentEvapLoss(doc);
      if (loss === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += loss;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += loss;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateBlowdownRate(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({
      label: bucket.timestamp,
      value: 0,
    }));

    if (data.length === 0) {
      return { grouped: emptyBuckets, overallAverage: 0 };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const calculateDocumentBlowdown = (doc: any): number | null => {
      const losses: number[] = [];
      const constant = 0.00085 * 1.8;

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          const evap =
            constant *
            doc.CHCT1_FM_02_FR *
            (doc.CHCT1_TEMP_RTD_02_AI - doc.CHCT1_TEMP_RTD_01_AI);
          losses.push(evap / 6);
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          const evap =
            constant *
            doc.CHCT2_FM_02_FR *
            (doc.CHCT2_TEMP_RTD_02_AI - doc.CHCT2_TEMP_RTD_01_AI);
          losses.push(evap / 6);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          const evap =
            constant *
            doc.CT1_FM_02_FR *
            (doc.CT1_TEMP_RTD_02_AI - doc.CT1_TEMP_RTD_01_AI);
          losses.push(evap / 6);
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          const evap =
            constant *
            doc.CT2_FM_02_FR *
            (doc.CT2_TEMP_RTD_02_AI - doc.CT2_TEMP_RTD_01_AI);
          losses.push(evap / 6);
        }
      }

      return losses.length > 0
        ? losses.reduce((a, b) => a + b, 0) / losses.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const loss = calculateDocumentBlowdown(doc);
      if (loss === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += loss;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += loss;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateMakeupWater(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({ label: bucket.timestamp, value: 0 }));

    if (data.length === 0) {
      return { grouped: emptyBuckets, overallAverage: 0 };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const constant = 0.00085 * 1.8;

    const calculateDocumentMakeupWater = (doc: any): number | null => {
      const values: number[] = [];

      const computeLosses = (
        flow: number,
        hot: number,
        cold: number,
      ): number => {
        const evap = constant * flow * (hot - cold);
        const blowdown = evap / 6;
        const drift = 0.0005 * flow;
        return evap + blowdown + drift;
      };

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CHCT1_FM_02_FR,
              doc.CHCT1_TEMP_RTD_02_AI,
              doc.CHCT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CHCT2_FM_02_FR,
              doc.CHCT2_TEMP_RTD_02_AI,
              doc.CHCT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CT1_FM_02_FR,
              doc.CT1_TEMP_RTD_02_AI,
              doc.CT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CT2_FM_02_FR,
              doc.CT2_TEMP_RTD_02_AI,
              doc.CT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const value = calculateDocumentMakeupWater(doc);
      if (value === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += value;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }

      const group = groupMap.get(groupKey)!;
      group.sum += value;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateCoolingCapacity(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const Cp = 4.186; // kJ/kg°C

    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({
      label: bucket.timestamp,
      value: 0,
    }));

    if (data.length === 0) return { grouped: emptyBuckets, overallAverage: 0 };

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time)
        return new Date(
          doc.PLC_Date_Time.replace('DT#', '').replace(/-/g, '/'),
        );
      return new Date();
    };

    const calculateDocCapacity = (doc: any): number | null => {
      const capacities: number[] = [];

      const compute = (flow: number, hot: number, cold: number) =>
        Cp * flow * (hot - cold); // Units = kJ/s = kW

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CHCT1_FM_02_FR,
              doc.CHCT1_TEMP_RTD_02_AI,
              doc.CHCT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CHCT2_FM_02_FR,
              doc.CHCT2_TEMP_RTD_02_AI,
              doc.CHCT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CT1_FM_02_FR,
              doc.CT1_TEMP_RTD_02_AI,
              doc.CT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CT2_FM_02_FR,
              doc.CT2_TEMP_RTD_02_AI,
              doc.CT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      return capacities.length > 0
        ? capacities.reduce((a, b) => a + b, 0) / capacities.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const capacity = calculateDocCapacity(doc);
      if (capacity === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += capacity;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) groupMap.set(groupKey, { sum: 0, count: 0 });
      const group = groupMap.get(groupKey)!;
      group.sum += capacity;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) =>
      groupMap.has(bucket.label)
        ? {
            label: bucket.label,
            value:
              groupMap.get(bucket.label)!.sum /
              groupMap.get(bucket.label)!.count,
          }
        : bucket,
    );

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateWaterEfficiencyIndex(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    const emptyBuckets = this.generateEmptyBuckets(
      startDate,
      endDate,
      groupBy,
    ).map((bucket) => ({ label: bucket.timestamp, value: 0 }));

    if (data.length === 0) {
      return { grouped: emptyBuckets, overallAverage: 0 };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        const dateString = doc.PLC_Date_Time.replace('DT#', '').replace(
          /-/g,
          '/',
        );
        return new Date(dateString);
      }
      return new Date();
    };

    const Cp = 4.186; // kJ/kg°C
    const constant = 0.00085 * 1.8;

    const calculateDocCapacity = (doc: any): number | null => {
      const capacities: number[] = [];

      const compute = (flow: number, hot: number, cold: number) =>
        Cp * flow * (hot - cold);

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CHCT1_FM_02_FR,
              doc.CHCT1_TEMP_RTD_02_AI,
              doc.CHCT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CHCT2_FM_02_FR,
              doc.CHCT2_TEMP_RTD_02_AI,
              doc.CHCT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CT1_FM_02_FR,
              doc.CT1_TEMP_RTD_02_AI,
              doc.CT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          capacities.push(
            compute(
              doc.CT2_FM_02_FR,
              doc.CT2_TEMP_RTD_02_AI,
              doc.CT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      return capacities.length > 0
        ? capacities.reduce((a, b) => a + b, 0) / capacities.length
        : null;
    };

    const calculateDocMakeupWater = (doc: any): number | null => {
      const values: number[] = [];

      const computeLosses = (
        flow: number,
        hot: number,
        cold: number,
      ): number => {
        const evap = constant * flow * (hot - cold);
        const blowdown = evap / 6;
        const drift = 0.0005 * flow;
        return evap + blowdown + drift;
      };

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CHCT1_FM_02_FR,
              doc.CHCT1_TEMP_RTD_02_AI,
              doc.CHCT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CHCT2_FM_02_FR,
              doc.CHCT2_TEMP_RTD_02_AI,
              doc.CHCT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CT1_FM_02_FR,
              doc.CT1_TEMP_RTD_02_AI,
              doc.CT1_TEMP_RTD_01_AI,
            ),
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          values.push(
            computeLosses(
              doc.CT2_FM_02_FR,
              doc.CT2_TEMP_RTD_02_AI,
              doc.CT2_TEMP_RTD_01_AI,
            ),
          );
        }
      }

      return values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const capacity = calculateDocCapacity(doc);
      const makeup = calculateDocMakeupWater(doc);
      if (capacity === null || makeup === null || makeup === 0) continue;

      const efficiency = capacity / makeup;
      const docDate = getDocumentDate(doc);
      totalSum += efficiency;
      totalCount++;

      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = format(docDate, 'yyyy-MM-dd HH:00');
          break;
        case 'day':
          groupKey = format(docDate, 'yyyy-MM-dd');
          break;
        case 'week':
          groupKey = `${getYear(docDate)}-W${String(getWeek(docDate)).padStart(2, '0')}`;
          break;
        case 'month':
          groupKey = format(docDate, 'yyyy-MM');
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }
      const group = groupMap.get(groupKey)!;
      group.sum += efficiency;
      group.count++;
    }

    const grouped = emptyBuckets.map((bucket) => {
      if (groupMap.has(bucket.label)) {
        const group = groupMap.get(bucket.label)!;
        return {
          label: bucket.label,
          value: group.sum / group.count,
        };
      }
      return bucket;
    });

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }

  static generateEmptyBuckets(
    start: Date,
    end: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month',
  ): { timestamp: string; value: number }[] {
    const buckets: { timestamp: string; value: number }[] = [];
    let current = new Date(start);
    const endTime = end.getTime();

    switch (groupBy) {
      case 'hour':
        current = startOfHour(start);
        while (current <= end) {
          buckets.push({
            timestamp: format(current, 'yyyy-MM-dd HH:00'),
            value: 0,
          });
          current = addHours(current, 1);
        }
        break;

      case 'day':
        current = startOfDay(start);
        while (current <= end) {
          buckets.push({
            timestamp: format(current, 'yyyy-MM-dd'),
            value: 0,
          });
          current = addDays(current, 1);
        }
        break;

      case 'week':
        const weekCount = Math.ceil(differenceInDays(end, start) / 7);
        for (let i = 0; i <= weekCount; i++) {
          const weekStart = addWeeks(start, i);
          const weekNum = getWeek(weekStart);
          buckets.push({
            timestamp: `${getYear(weekStart)}-W${String(weekNum).padStart(2, '0')}`,
            value: 0,
          });
        }
        break;

      case 'month':
        const monthCount = differenceInMonths(end, start) + 1;
        for (let i = 0; i < monthCount; i++) {
          const month = addMonths(start, i);
          buckets.push({
            timestamp: format(month, 'yyyy-MM'),
            value: 0,
          });
        }
        break;
    }

    return buckets;
  }
}
