// towerdataformulating-utils.ts
import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  format,
  getDay,
  getHours,
  getMonth,
  getWeek,
  getYear,
  isSameDay,
  isSameHour,
  isSameMonth,
  startOfDay,
  startOfHour,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
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
