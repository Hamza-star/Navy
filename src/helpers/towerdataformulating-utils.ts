export class TowerDataProcessor {
  static calculateRange(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    // Helper to parse document date
    const getDocumentDate = (doc: any): Date => {
      if (typeof doc.timestamp === 'object' && doc.timestamp.$date) {
        return new Date(doc.timestamp.$date);
      } else if (typeof doc.timestamp === 'string') {
        return new Date(doc.timestamp);
      } else if (doc.Time) {
        return new Date(doc.Time);
      }
      return new Date(); // Fallback
    };

    // Helper to get ISO week number
    const getWeekNumber = (d: Date): string => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
      const week1 = new Date(date.getFullYear(), 0, 4);
      const weekNum =
        `0${1 + Math.round((date.getTime() - week1.getTime()) / 604800000)}`.slice(
          -2,
        );
      return `${date.getFullYear()}-W${weekNum}`;
    };

    // Calculate range for a single document
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

    // Process all documents
    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docRange = calculateDocumentRange(doc);
      if (docRange === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docRange;
      totalCount++;

      // Determine group key based on grouping type
      let groupKey = '';
      switch (groupBy) {
        case 'hour':
          groupKey = `${docDate.getFullYear()}-${(docDate.getMonth() + 1)
            .toString()
            .padStart(
              2,
              '0',
            )}-${docDate.getDate().toString().padStart(2, '0')} ${docDate
            .getHours()
            .toString()
            .padStart(2, '0')}:00`;
          break;
        case 'day':
          groupKey = `${docDate.getFullYear()}-${(docDate.getMonth() + 1)
            .toString()
            .padStart(
              2,
              '0',
            )}-${docDate.getDate().toString().padStart(2, '0')}`;
          break;
        case 'week':
          groupKey = getWeekNumber(docDate);
          break;
        case 'month':
          groupKey = `${docDate.getFullYear()}-${(docDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
          break;
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, { sum: 0, count: 0 });
      }
      const group = groupMap.get(groupKey)!;
      group.sum += docRange;
      group.count++;
    }

    // Prepare grouped results
    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

    // Calculate overall average
    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
}
