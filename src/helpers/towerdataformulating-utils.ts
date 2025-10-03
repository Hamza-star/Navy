/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import moment from 'moment-timezone';

export interface GroupedData {
  label: string;
  value: number;
}

export interface TowerResult {
  grouped: GroupedData[];
  overallAverage: number;
}

export interface CombinedResult {
  grouped: GroupedData[];
  overallAverage: number;
  perTower: Record<string, TowerResult>;
}

export class TowerDataProcessor {
  // resolve tower keys from input (supports "CT", "CHCT", "all" and single tower names)
  private static getTowerKeys(
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
  ): string[] {
    if (towerType === 'CHCT') return ['CHCT1', 'CHCT2'];
    if (towerType === 'CT') return ['CT1', 'CT2'];
    if (towerType === 'all') return ['CHCT1', 'CHCT2', 'CT1', 'CT2'];
    return [towerType]; // single tower name passed
  }

  private static getDocumentDate(doc: Record<string, unknown>): Date {
    const ts = doc.timestamp;
    if (ts && typeof ts === 'object' && '$date' in ts) {
      const d = (ts as any).$date;
      return new Date(d as string | number);
    }
    if (typeof ts === 'string') return new Date(ts);
    if (doc.Time) return new Date(String((doc as any).Time));
    if (typeof (doc as any).UNIXtimestamp === 'number')
      return new Date(((doc as any).UNIXtimestamp as number) * 1000);
    if (typeof (doc as any).PLC_Date_Time === 'string') {
      const s = ((doc as any).PLC_Date_Time as string)
        .replace('DT#', '')
        .replace(/-/g, '/');
      return new Date(s);
    }
    return new Date();
  }

  private static getGroupKey(
    date: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month',
  ): string {
    switch (groupBy) {
      case 'hour':
        return format(date, 'yyyy-MM-dd HH:00');
      case 'day':
        return format(date, 'yyyy-MM-dd');
      case 'week':
        return `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`;
      case 'month':
        return format(date, 'yyyy-MM');
      default:
        return format(date, 'yyyy-MM-dd');
    }
  }

  // private static combineTowerResults(
  //   perTowerResults: Record<string, TowerResult>,
  // ): CombinedResult {
  //   const combinedGroupedMap = new Map<
  //     string,
  //     { sum: number; count: number }
  //   >();
  //   let totalSum = 0;
  //   let totalCount = 0;

  //   for (const r of Object.values(perTowerResults)) {
  //     for (const g of r.grouped) {
  //       if (!combinedGroupedMap.has(g.label))
  //         combinedGroupedMap.set(g.label, { sum: 0, count: 0 });
  //       const mg = combinedGroupedMap.get(g.label)!;
  //       mg.sum += g.value;
  //       mg.count++;
  //     }
  //     totalSum += r.overallAverage;
  //     totalCount++;
  //   }

  //   const grouped = Array.from(combinedGroupedMap.entries()).map(
  //     ([label, { sum, count }]) => ({
  //       label,
  //       value: sum / count,
  //     }),
  //   );

  //   return {
  //     grouped,
  //     overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
  //     perTower: perTowerResults,
  //   };
  // }

  static combineTowerResults(
    perTowerResults: Record<string, TowerResult>,
  ): CombinedResult {
    const towers = Object.keys(perTowerResults);

    // ✅ Agar sirf ek tower hai to uska data hi combined ke roop me return karo
    if (towers.length === 1) {
      const onlyTower = towers[0];
      return {
        grouped: perTowerResults[onlyTower].grouped,
        overallAverage: perTowerResults[onlyTower].overallAverage,
        perTower: {
          [onlyTower]: perTowerResults[onlyTower],
        },
      };
    }

    // ✅ Agar multiple towers hain to unka combine karo
    const combinedMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const tower of towers) {
      const result = perTowerResults[tower];
      totalSum += result.overallAverage * result.grouped.length;
      totalCount += result.grouped.length;

      for (const g of result.grouped) {
        if (!combinedMap.has(g.label)) {
          combinedMap.set(g.label, { sum: 0, count: 0 });
        }
        const entry = combinedMap.get(g.label)!;
        entry.sum += g.value;
        entry.count++;
      }
    }

    const grouped = Array.from(combinedMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

    return {
      grouped,
      overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      perTower: perTowerResults,
    };
  }

  // static calculateRange(
  //   data: Array<Record<string, unknown>>,
  //   towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
  //   groupBy: 'hour' | 'day' | 'week' | 'month',
  //   startDate: Date,
  //   endDate: Date,
  // ): CombinedResult {
  //   const towerKeys = this.getTowerKeys(towerType);
  //   const perTowerResults: Record<string, TowerResult> = {};

  //   for (const tower of towerKeys) {
  //     const groupMap = new Map<string, { sum: number; count: number }>();
  //     let totalSum = 0;
  //     let totalCount = 0;

  //     for (const doc of data) {
  //       const val = (doc as any)[`${tower}_Range`];
  //       if (typeof val !== 'number') continue;

  //       totalSum += val;
  //       totalCount++;

  //       const docDate = TowerDataProcessor.getDocumentDate(doc);
  //       const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

  //       if (!groupMap.has(groupKey))
  //         groupMap.set(groupKey, { sum: 0, count: 0 });
  //       const g = groupMap.get(groupKey)!;
  //       g.sum += val;
  //       g.count++;
  //     }

  //     const grouped = Array.from(groupMap.entries()).map(
  //       ([label, { sum, count }]) => ({
  //         label,
  //         value: sum / count,
  //       }),
  //     );

  //     perTowerResults[tower] = {
  //       grouped,
  //       overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
  //     };
  //   }

  //   return TowerDataProcessor.combineTowerResults(perTowerResults);
  // }

  static calculateRange(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): CombinedResult {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    const normalize = (s: string) =>
      String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    for (const tower of towerKeys) {
      const towerNorm = normalize(tower);

      // candidate explicit field names (common variants)
      const explicitCandidates = [
        `${tower}_Range`,
        `${tower}Range`,
        `${tower.toLowerCase()}_range`,
        `${tower.toLowerCase()}Range`,
        `${tower}_RANGE`,
        `${tower}__Range`,
      ];

      const groupMap = new Map<string, { sum: number; count: number }>();
      let totalSum = 0;
      let totalCount = 0;

      for (const doc of data) {
        let val: number | undefined;

        // 1) Try explicit candidates first
        for (const f of explicitCandidates) {
          if (typeof (doc as any)[f] === 'number') {
            val = (doc as any)[f] as number;
            break;
          }
        }

        // 2) If not found, scan all keys for a key that *looks* like tower + "range"
        if (typeof val !== 'number') {
          for (const k of Object.keys(doc)) {
            const kn = normalize(k);
            // require "range" and tower in the normalized key
            if (kn.includes('range') && kn.includes(towerNorm)) {
              const maybe = (doc as any)[k];
              if (typeof maybe === 'number') {
                val = maybe;
                break;
              }
            }
          }
        }

        // 3) Fallback: compute hot - cold if those fields exist
        if (typeof val !== 'number') {
          const hot = (doc as any)[`${tower}_TEMP_RTD_02_AI`];
          const cold = (doc as any)[`${tower}_TEMP_RTD_01_AI`];
          if (typeof hot === 'number' && typeof cold === 'number') {
            // fallback calculation — keeps same units as original temps
            val = hot - cold;
          }
        }

        // If still not a number, skip this doc
        if (typeof val !== 'number') continue;

        // optional: respect startDate/endDate if you want (your DB query probably already filters)
        const docDate = TowerDataProcessor.getDocumentDate(doc);
        // if you want to guard by date uncomment next lines:
        // if (docDate < startDate || docDate > endDate) continue;

        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += val;
        g.count++;

        totalSum += val;
        totalCount++;
      } // end docs loop

      const grouped = Array.from(groupMap.entries()).map(
        ([label, { sum, count }]) => ({
          label,
          value: sum / count,
        }),
      );

      perTowerResults[tower] = {
        grouped,
        overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      };
    } // end towers loop

    // Always return combined structure (consistent with approach etc.)
    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateApproach(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    wetBulb: number,
  ): CombinedResult {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();
      let totalSum = 0;
      let totalCount = 0;

      for (const doc of data) {
        const cold = (doc as any)[`${tower}_TEMP_RTD_01_AI`];
        if (typeof cold !== 'number') continue;

        const approach = cold - wetBulb;
        totalSum += approach;
        totalCount++;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += approach;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries()).map(
        ([label, { sum, count }]) => ({
          label,
          value: sum / count,
        }),
      );

      perTowerResults[tower] = {
        grouped,
        overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateCoolingEfficiency(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    wetBulb: number,
  ): CombinedResult {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();
      let totalSum = 0;
      let totalCount = 0;

      for (const doc of data) {
        const hot = (doc as any)[`${tower}_TEMP_RTD_02_AI`];
        const cold = (doc as any)[`${tower}_TEMP_RTD_01_AI`];
        if (typeof hot !== 'number' || typeof cold !== 'number') continue;

        const denom = hot - wetBulb;
        if (denom === 0) continue;

        const eff = ((hot - cold) / denom) * 100;
        totalSum += eff;
        totalCount++;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += eff;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries()).map(
        ([label, { sum, count }]) => ({
          label,
          value: sum / count,
        }),
      );

      perTowerResults[tower] = {
        grouped,
        overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateFanSpeed(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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
        if (typeof doc.CHCT1_INV_01_SPD_AI === 'number')
          speeds.push(doc.CHCT1_INV_01_SPD_AI);
        if (typeof doc.CHCT2_INV_01_SPD_AI === 'number')
          speeds.push(doc.CHCT2_INV_01_SPD_AI);
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (typeof doc.CT1_INV_01_SPD_AI === 'number')
          speeds.push(doc.CT1_INV_01_SPD_AI);
        if (typeof doc.CT2_INV_01_SPD_AI === 'number')
          speeds.push(doc.CT2_INV_01_SPD_AI);
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

    // ✅ Only keep buckets that have data
    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

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
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    const grouped = Array.from(groupMap.entries()).map(([label, group]) => ({
      label,
      value: group.sum / group.count,
    }));

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
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

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
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

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
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateCoolingCapacity(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): CombinedResult {
    const Cp = 4.186; // kJ/kg°C
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();
      let totalSum = 0;
      let totalCount = 0;

      for (const doc of data) {
        const flow = (doc as any)[`${tower}_FM_02_FR`];
        const hot = (doc as any)[`${tower}_TEMP_RTD_02_AI`];
        const cold = (doc as any)[`${tower}_TEMP_RTD_01_AI`];

        if (
          typeof flow !== 'number' ||
          typeof hot !== 'number' ||
          typeof cold !== 'number'
        )
          continue;

        const capacity = Cp * flow * (hot - cold); // same units as your original
        totalSum += capacity;
        totalCount++;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += capacity;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries()).map(
        ([label, { sum, count }]) => ({
          label,
          value: sum / count,
        }),
      );

      perTowerResults[tower] = {
        grouped,
        overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateWaterEfficiencyIndex(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): CombinedResult {
    const REFERENCE_EFFICIENCY = 0.001; // 1 kWh per 1000 liters => baseline
    const Cp = 4.186;
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groups: Record<
        string,
        { total_kWh: number; total_L: number; count: number }
      > = {};
      let total_kWh_overall = 0;
      let total_L_overall = 0;
      let validCount = 0;

      for (const doc of data) {
        const flow = (doc as any)[`${tower}_FM_02_FR`];
        const hot = (doc as any)[`${tower}_TEMP_RTD_02_AI`];
        const cold = (doc as any)[`${tower}_TEMP_RTD_01_AI`];

        if (
          typeof flow !== 'number' ||
          typeof hot !== 'number' ||
          typeof cold !== 'number'
        )
          continue;

        const capacity_kW = (Cp * flow * (hot - cold)) / 3600; // kW (since Cp kJ/kg)
        const constant = 0.00085 * 1.8;
        const evap = constant * flow * (hot - cold);
        const blowdown = evap / 6;
        const drift = 0.0005 * flow;
        const makeup_m3h = evap + blowdown + drift;

        if (
          !Number.isFinite(capacity_kW) ||
          !Number.isFinite(makeup_m3h) ||
          makeup_m3h <= 0
        )
          continue;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        if (docDate < startDate || docDate > endDate) continue;

        const hrs = 1;
        const kWh = capacity_kW * hrs;
        const liters = makeup_m3h * hrs * 1000;

        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groups[groupKey])
          groups[groupKey] = { total_kWh: 0, total_L: 0, count: 0 };
        groups[groupKey].total_kWh += kWh;
        groups[groupKey].total_L += liters;
        groups[groupKey].count += 1;

        total_kWh_overall += kWh;
        total_L_overall += liters;
        validCount++;
      }

      const groupedResults: GroupedData[] = [];
      for (const key of Object.keys(groups)) {
        const { total_kWh, total_L } = groups[key];
        if (total_L === 0) continue;
        const actualEfficiency = total_kWh / total_L; // kWh per liter
        const efficiencyPercent =
          (actualEfficiency / REFERENCE_EFFICIENCY) * 100;
        groupedResults.push({
          label: key,
          value: parseFloat(efficiencyPercent.toFixed(2)),
        });
      }

      const overallEfficiencyPercent =
        total_L_overall > 0
          ? (total_kWh_overall / total_L_overall / REFERENCE_EFFICIENCY) * 100
          : 0;

      perTowerResults[tower] = {
        grouped: groupedResults,
        overallAverage: parseFloat(overallEfficiencyPercent.toFixed(2)),
      };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateFanPowerConsumption(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
    }

    const getDocumentDate = (doc: any): Date => {
      if (doc.timestamp?.$date) return new Date(doc.timestamp.$date);
      if (typeof doc.timestamp === 'string') return new Date(doc.timestamp);
      if (doc.Time) return new Date(doc.Time);
      if (doc.UNIXtimestamp) return new Date(doc.UNIXtimestamp * 1000);
      if (doc.PLC_Date_Time) {
        return new Date(
          doc.PLC_Date_Time.replace('DT#', '').replace(/-/g, '/'),
        );
      }
      return new Date();
    };

    const calculateDocumentPower = (doc: any): number | null => {
      const powers: number[] = [];

      const getTowerPower = (
        phaseA?: number,
        phaseB?: number,
        phaseC?: number,
      ): number | null => {
        if (
          typeof phaseA === 'number' &&
          typeof phaseB === 'number' &&
          typeof phaseC === 'number'
        ) {
          return phaseA + phaseB + phaseC;
        }
        return null;
      };

      if (towerType === 'CHCT' || towerType === 'all') {
        const chct1Power = getTowerPower(
          doc.CHCT1_EM01_ActivePower_A_kW,
          doc.CHCT1_EM01_ActivePower_B_kW,
          doc.CHCT1_EM01_ActivePower_C_kW,
        );
        if (chct1Power !== null) powers.push(chct1Power);

        const chct2Power = getTowerPower(
          doc.CHCT2_EM01_ActivePower_A_kW,
          doc.CHCT2_EM01_ActivePower_B_kW,
          doc.CHCT2_EM01_ActivePower_C_kW,
        );
        if (chct2Power !== null) powers.push(chct2Power);
      }

      if (towerType === 'CT' || towerType === 'all') {
        const ct1Power = getTowerPower(
          doc.CT1_EM01_ActivePower_A_kW,
          doc.CT1_EM01_ActivePower_B_kW,
          doc.CT1_EM01_ActivePower_C_kW,
        );
        if (ct1Power !== null) powers.push(ct1Power);

        const ct2Power = getTowerPower(
          doc.CT2_EM01_ActivePower_A_kW,
          doc.CT2_EM01_ActivePower_B_kW,
          doc.CT2_EM01_ActivePower_C_kW,
        );
        if (ct2Power !== null) powers.push(ct2Power);
      }

      return powers.length > 0
        ? powers.reduce((a, b) => a + b, 0) / powers.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const docPower = calculateDocumentPower(doc);
      if (docPower === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += docPower;
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
      group.sum += docPower;
      group.count++;
    }

    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

    const overallAverage = totalCount > 0 ? totalSum / totalCount : 0;

    return { grouped, overallAverage };
  }
  static calculateFanEfficiencyIndex(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    const calculateTowerData = (
      flow: number,
      hot: number,
      cold: number,
      pA: number,
      pB: number,
      pC: number,
    ) => {
      if ([flow, hot, cold, pA, pB, pC].some((v) => typeof v !== 'number'))
        return { capacity: 0, power: 0 };
      const capacity = Cp * flow * (hot - cold); // kW
      const power = pA + pB + pC; // kW
      return { capacity, power };
    };

    const groupMap = new Map<
      string,
      { totalCapacity: number; totalPower: number }
    >();
    let grandCapacity = 0;
    let grandPower = 0;

    for (const doc of data) {
      const date = getDocumentDate(doc);

      let totalCapacityThisDoc = 0;
      let totalPowerThisDoc = 0;

      if (towerType === 'CHCT' || towerType === 'all') {
        const chct1 = calculateTowerData(
          doc.CHCT1_FM_02_FR,
          doc.CHCT1_TEMP_RTD_02_AI,
          doc.CHCT1_TEMP_RTD_01_AI,
          doc.CHCT1_EM01_ActivePower_A_kW,
          doc.CHCT1_EM01_ActivePower_B_kW,
          doc.CHCT1_EM01_ActivePower_C_kW,
        );
        const chct2 = calculateTowerData(
          doc.CHCT2_FM_02_FR,
          doc.CHCT2_TEMP_RTD_02_AI,
          doc.CHCT2_TEMP_RTD_01_AI,
          doc.CHCT2_EM01_ActivePower_A_kW,
          doc.CHCT2_EM01_ActivePower_B_kW,
          doc.CHCT2_EM01_ActivePower_C_kW,
        );

        totalCapacityThisDoc += chct1.capacity + chct2.capacity;
        totalPowerThisDoc += chct1.power + chct2.power;
      }

      if (towerType === 'CT' || towerType === 'all') {
        const ct1 = calculateTowerData(
          doc.CT1_FM_02_FR,
          doc.CT1_TEMP_RTD_02_AI,
          doc.CT1_TEMP_RTD_01_AI,
          doc.CT1_EM01_ActivePower_A_kW,
          doc.CT1_EM01_ActivePower_B_kW,
          doc.CT1_EM01_ActivePower_C_kW,
        );
        const ct2 = calculateTowerData(
          doc.CT2_FM_02_FR,
          doc.CT2_TEMP_RTD_02_AI,
          doc.CT2_TEMP_RTD_01_AI,
          doc.CT2_EM01_ActivePower_A_kW,
          doc.CT2_EM01_ActivePower_B_kW,
          doc.CT2_EM01_ActivePower_C_kW,
        );

        totalCapacityThisDoc += ct1.capacity + ct2.capacity;
        totalPowerThisDoc += ct1.power + ct2.power;
      }

      if (totalPowerThisDoc > 0) {
        grandCapacity += totalCapacityThisDoc;
        grandPower += totalPowerThisDoc;

        let groupKey = '';
        switch (groupBy) {
          case 'hour':
            groupKey = format(date, 'yyyy-MM-dd HH:00');
            break;
          case 'day':
            groupKey = format(date, 'yyyy-MM-dd');
            break;
          case 'week':
            groupKey = `${getYear(date)}-W${String(getWeek(date)).padStart(2, '0')}`;
            break;
          case 'month':
            groupKey = format(date, 'yyyy-MM');
            break;
        }

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, { totalCapacity: 0, totalPower: 0 });
        }
        const group = groupMap.get(groupKey)!;
        group.totalCapacity += totalCapacityThisDoc;
        group.totalPower += totalPowerThisDoc;
      }
    }

    const grouped = Array.from(groupMap.entries()).map(
      ([label, { totalCapacity, totalPower }]) => ({
        label,
        value: totalPower > 0 ? totalCapacity / totalPower : 0, // matches Excel's total-sum logic
      }),
    );

    const overallAverage = grandPower > 0 ? grandCapacity / grandPower : 0;

    return { grouped, overallAverage };
  }

  static calculateWaterConsumption(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): CombinedResult {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();
      let totalSum = 0;
      let totalCount = 0;

      for (const doc of data) {
        const val = (doc as any)[`${tower}_FM_01_TOT`];
        if (typeof val !== 'number') continue;

        totalSum += val;
        totalCount++;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += val;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries()).map(
        ([label, { sum, count }]) => ({
          label,
          value: sum / count,
        }),
      );

      perTowerResults[tower] = {
        grouped,
        overallAverage: totalCount > 0 ? totalSum / totalCount : 0,
      };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateAverageEnergyUsage(
    data: Array<Record<string, unknown>>,
    towerType: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): CombinedResult {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, TowerResult> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, number>();
      const dailyTotals = new Map<string, number>();

      const sorted = [...data].sort(
        (a, b) =>
          TowerDataProcessor.getDocumentDate(a).getTime() -
          TowerDataProcessor.getDocumentDate(b).getTime(),
      );

      let lastSeen: number | null = null;
      for (const doc of sorted) {
        const cur = (doc as any)[`${tower}_EM01_ActiveEnergy_Total_kWhh`];
        if (typeof cur !== 'number') continue;

        if (lastSeen === null) {
          lastSeen = cur;
          continue;
        }

        const delta = cur - lastSeen;
        lastSeen = cur;

        if (!Number.isFinite(delta) || delta <= 0) continue;

        const docDate = TowerDataProcessor.getDocumentDate(doc);
        const groupKey = TowerDataProcessor.getGroupKey(docDate, groupBy);
        groupMap.set(groupKey, (groupMap.get(groupKey) ?? 0) + delta);

        const dayKey = format(docDate, 'yyyy-MM-dd');
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + delta);
      }

      const grouped = Array.from(groupMap.entries()).map(([label, value]) => ({
        label,
        value,
      }));
      const totalEnergy = Array.from(dailyTotals.values()).reduce(
        (a, b) => a + b,
        0,
      );
      const daysWithData = Array.from(dailyTotals.values()).filter(
        (v) => v > 0,
      ).length;
      const overallAverage = daysWithData > 0 ? totalEnergy / daysWithData : 0;

      perTowerResults[tower] = { grouped, overallAverage };
    }

    return TowerDataProcessor.combineTowerResults(perTowerResults);
  }

  static calculateDriftToEvapRatio(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): { grouped: { label: string; value: number }[]; overallAverage: number } {
    if (data.length === 0) {
      return { grouped: [], overallAverage: 0 };
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

    // Constants
    const driftConstant = 0.0005; // 0.05%
    const evapConstant = 0.00085 * 1.8;

    const calculateDocumentRatio = (doc: any): number | null => {
      const ratios: number[] = [];

      const calculateTowerRatio = (
        flow: number,
        hotTemp: number,
        coldTemp: number,
      ) => {
        const drift = driftConstant * flow;
        const evap = evapConstant * flow * (hotTemp - coldTemp);
        return evap > 0 ? drift / evap : null;
      };

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          const ratio = calculateTowerRatio(
            doc.CHCT1_FM_02_FR,
            doc.CHCT1_TEMP_RTD_02_AI,
            doc.CHCT1_TEMP_RTD_01_AI,
          );
          if (ratio !== null) ratios.push(ratio);
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          const ratio = calculateTowerRatio(
            doc.CHCT2_FM_02_FR,
            doc.CHCT2_TEMP_RTD_02_AI,
            doc.CHCT2_TEMP_RTD_01_AI,
          );
          if (ratio !== null) ratios.push(ratio);
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          const ratio = calculateTowerRatio(
            doc.CT1_FM_02_FR,
            doc.CT1_TEMP_RTD_02_AI,
            doc.CT1_TEMP_RTD_01_AI,
          );
          if (ratio !== null) ratios.push(ratio);
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          const ratio = calculateTowerRatio(
            doc.CT2_FM_02_FR,
            doc.CT2_TEMP_RTD_02_AI,
            doc.CT2_TEMP_RTD_01_AI,
          );
          if (ratio !== null) ratios.push(ratio);
        }
      }

      return ratios.length > 0
        ? ratios.reduce((a, b) => a + b, 0) / ratios.length
        : null;
    };

    const groupMap = new Map<string, { sum: number; count: number }>();
    let totalSum = 0;
    let totalCount = 0;

    for (const doc of data) {
      const ratio = calculateDocumentRatio(doc);
      if (ratio === null) continue;

      const docDate = getDocumentDate(doc);
      totalSum += ratio;
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
      group.sum += ratio;
      group.count++;
    }

    // Only groups with data
    const grouped = Array.from(groupMap.entries()).map(
      ([label, { sum, count }]) => ({
        label,
        value: sum / count,
      }),
    );

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
  private static getIntervalKey(
    date: Date,
    type: 'hour' | 'day' | 'month',
  ): string {
    switch (type) {
      case 'hour':
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${date
          .getDate()
          .toString()
          .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}`;
      case 'day':
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
      default:
        return '';
    }
  }

  static calculateCoolingEfficiencyByTower(
    data: any[],
    wetBulb: number,
  ): { [towerId: string]: number } {
    const results: { [key: string]: { sum: number; count: number } } = {
      CHCT1: { sum: 0, count: 0 },
      CHCT2: { sum: 0, count: 0 },
      CT1: { sum: 0, count: 0 },
      CT2: { sum: 0, count: 0 },
    };

    for (const doc of data) {
      const calcEfficiency = (hot: number, cold: number): number | null => {
        const denom = hot - wetBulb;
        return denom !== 0 ? ((hot - cold) / denom) * 100 : null;
      };

      // CHCT1
      if (
        typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
      ) {
        const eff = calcEfficiency(
          doc.CHCT1_TEMP_RTD_02_AI,
          doc.CHCT1_TEMP_RTD_01_AI,
        );
        if (eff !== null) {
          results.CHCT1.sum += eff;
          results.CHCT1.count++;
        }
      }

      // CHCT2
      if (
        typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
      ) {
        const eff = calcEfficiency(
          doc.CHCT2_TEMP_RTD_02_AI,
          doc.CHCT2_TEMP_RTD_01_AI,
        );
        if (eff !== null) {
          results.CHCT2.sum += eff;
          results.CHCT2.count++;
        }
      }

      // CT1
      if (
        typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CT1_TEMP_RTD_01_AI === 'number'
      ) {
        const eff = calcEfficiency(
          doc.CT1_TEMP_RTD_02_AI,
          doc.CT1_TEMP_RTD_01_AI,
        );
        if (eff !== null) {
          results.CT1.sum += eff;
          results.CT1.count++;
        }
      }

      // CT2
      if (
        typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CT2_TEMP_RTD_01_AI === 'number'
      ) {
        const eff = calcEfficiency(
          doc.CT2_TEMP_RTD_02_AI,
          doc.CT2_TEMP_RTD_01_AI,
        );
        if (eff !== null) {
          results.CT2.sum += eff;
          results.CT2.count++;
        }
      }
    }

    return {
      CHCT1:
        results.CHCT1.count > 0 ? results.CHCT1.sum / results.CHCT1.count : 0,
      CHCT2:
        results.CHCT2.count > 0 ? results.CHCT2.sum / results.CHCT2.count : 0,
      CT1: results.CT1.count > 0 ? results.CT1.sum / results.CT1.count : 0,
      CT2: results.CT2.count > 0 ? results.CT2.sum / results.CT2.count : 0,
    };
  }
  static calculateCoolingEfficiencyByTowerInCoolingCapacity(
    data: any[],
    wetBulb: number,
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towers: string[] = ['CHCT1', 'CHCT2', 'CT1', 'CT2'],
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = { sum: 0, count: 0 };
    });

    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const hotField = `${tower}_TEMP_RTD_02_AI`;
      const coldField = `${tower}_TEMP_RTD_01_AI`;

      if (
        typeof doc[hotField] === 'number' &&
        typeof doc[coldField] === 'number'
      ) {
        const hot = doc[hotField];
        const cold = doc[coldField];
        const denom = hot - wetBulb;
        if (denom !== 0) {
          const efficiency = ((hot - cold) / denom) * 100;
          acc[tower].sum += efficiency;
          acc[tower].count++;
        }
      }
    };

    for (const doc of data) {
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        const intervalKey = TowerDataProcessor.getIntervalKey(
          date,
          breakdownType,
        );

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = { sum: 0, count: 0 };
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    const overallResult: any = {};
    towers.forEach((tower) => {
      overallResult[tower] =
        overallAccumulator[tower].count > 0
          ? overallAccumulator[tower].sum / overallAccumulator[tower].count
          : 0;
    });

    let breakdownResult: Array<{ interval: string; values: any }> | undefined;
    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => {
          const values: any = {};
          towers.forEach((tower) => {
            values[tower] =
              acc[tower].count > 0 ? acc[tower].sum / acc[tower].count : 0;
          });
          return { interval, values };
        },
      );
      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }

  static calculateCoolingEffectivenessByInterval(
    data: any[],
    wetBulb: number,
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towerType: 'CHCT' | 'CT' | 'all' = 'all',
  ): Array<{ interval: string; averageEffectiveness: number }> {
    const breakdownAccumulator: Record<string, { sum: number; count: number }> =
      {};

    const towerFieldsMap = {
      CHCT: ['CHCT1', 'CHCT2'],
      CT: ['CT1', 'CT2'],
      all: ['CHCT1', 'CHCT2', 'CT1', 'CT2'],
    };

    const selectedTowers = towerFieldsMap[towerType];

    const calcEffectiveness = (hot: number, cold: number): number | null => {
      const denom = hot - wetBulb;
      return denom !== 0 ? ((hot - cold) / denom) * 100 : null;
    };

    for (const doc of data) {
      const effectivenessValues: number[] = [];

      for (const prefix of selectedTowers) {
        const hot = doc[`${prefix}_TEMP_RTD_02_AI`];
        const cold = doc[`${prefix}_TEMP_RTD_01_AI`];
        if (typeof hot === 'number' && typeof cold === 'number') {
          const eff = calcEffectiveness(hot, cold);
          if (eff !== null) {
            effectivenessValues.push(eff);
          }
        }
      }

      if (effectivenessValues.length === 0 || !doc.timestamp) continue;

      const date = new Date(doc.timestamp);
      let intervalKey: string;
      switch (breakdownType) {
        case 'hour':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(
              2,
              '0',
            )}-${date.getDate().toString().padStart(2, '0')} ${date
            .getHours()
            .toString()
            .padStart(2, '0')}`;
          break;
        case 'day':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          break;
        case 'month':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
          break;
        default:
          intervalKey = 'none';
      }

      if (!breakdownAccumulator[intervalKey]) {
        breakdownAccumulator[intervalKey] = { sum: 0, count: 0 };
      }

      const avgEffForDoc =
        effectivenessValues.reduce((a, b) => a + b, 0) /
        effectivenessValues.length;

      breakdownAccumulator[intervalKey].sum += avgEffForDoc;
      breakdownAccumulator[intervalKey].count++;
    }

    return Object.entries(breakdownAccumulator)
      .map(([interval, acc]) => ({
        interval,
        averageEffectiveness: acc.count > 0 ? acc.sum / acc.count : 0,
      }))
      .sort((a, b) => a.interval.localeCompare(b.interval));
  }

  // static calculateRangeByTower(
  //   data: any[],
  //   breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
  // ): {
  //   overall: { [towerId: string]: number };
  //   breakdown?: Array<{
  //     interval: string;
  //     values: { [towerId: string]: number };
  //   }>;
  // } {
  //   // Initialize accumulators
  //   const overallAccumulator = {
  //     CHCT1: { sum: 0, count: 0 },
  //     CHCT2: { sum: 0, count: 0 },
  //     CT1: { sum: 0, count: 0 },
  //     CT2: { sum: 0, count: 0 },
  //   };

  //   const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

  //   // Helper to update accumulators
  //   const updateAccumulator = (acc: any, doc: any) => {
  //     // CHCT1
  //     if (
  //       typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
  //       typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
  //     ) {
  //       const diff = doc.CHCT1_TEMP_RTD_02_AI - doc.CHCT1_TEMP_RTD_01_AI;
  //       acc.CHCT1.sum += diff;
  //       acc.CHCT1.count++;
  //     }
  //     // CHCT2
  //     if (
  //       typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
  //       typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
  //     ) {
  //       const diff = doc.CHCT2_TEMP_RTD_02_AI - doc.CHCT2_TEMP_RTD_01_AI;
  //       acc.CHCT2.sum += diff;
  //       acc.CHCT2.count++;
  //     }
  //     // CT1
  //     if (
  //       typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
  //       typeof doc.CT1_TEMP_RTD_01_AI === 'number'
  //     ) {
  //       const diff = doc.CT1_TEMP_RTD_02_AI - doc.CT1_TEMP_RTD_01_AI;
  //       acc.CT1.sum += diff;
  //       acc.CT1.count++;
  //     }
  //     // CT2
  //     if (
  //       typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
  //       typeof doc.CT2_TEMP_RTD_01_AI === 'number'
  //     ) {
  //       const diff = doc.CT2_TEMP_RTD_02_AI - doc.CT2_TEMP_RTD_01_AI;
  //       acc.CT2.sum += diff;
  //       acc.CT2.count++;
  //     }
  //   };

  //   // Process each document
  //   for (const doc of data) {
  //     // Update overall accumulator
  //     updateAccumulator(overallAccumulator, doc);

  //     // Process breakdown if needed
  //     if (breakdownType !== 'none' && doc.timestamp) {
  //       const date = new Date(doc.timestamp);
  //       let intervalKey: string;

  //       switch (breakdownType) {
  //         case 'hour':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}`;
  //           break;
  //         case 'day':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  //           break;
  //         case 'month':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  //           break;
  //         default:
  //           intervalKey = '';
  //       }

  //       if (!breakdownAccumulator[intervalKey]) {
  //         breakdownAccumulator[intervalKey] = {
  //           CHCT1: { sum: 0, count: 0 },
  //           CHCT2: { sum: 0, count: 0 },
  //           CT1: { sum: 0, count: 0 },
  //           CT2: { sum: 0, count: 0 },
  //         };
  //       }

  //       updateAccumulator(breakdownAccumulator[intervalKey], doc);
  //     }
  //   }

  //   // Calculate overall averages
  //   const overallResult = {
  //     CHCT1:
  //       overallAccumulator.CHCT1.count > 0
  //         ? overallAccumulator.CHCT1.sum / overallAccumulator.CHCT1.count
  //         : 0,
  //     CHCT2:
  //       overallAccumulator.CHCT2.count > 0
  //         ? overallAccumulator.CHCT2.sum / overallAccumulator.CHCT2.count
  //         : 0,
  //     CT1:
  //       overallAccumulator.CT1.count > 0
  //         ? overallAccumulator.CT1.sum / overallAccumulator.CT1.count
  //         : 0,
  //     CT2:
  //       overallAccumulator.CT2.count > 0
  //         ? overallAccumulator.CT2.sum / overallAccumulator.CT2.count
  //         : 0,
  //   };

  //   // Process breakdown if exists
  //   let breakdownResult:
  //     | Array<{ interval: string; values: { [towerId: string]: number } }>
  //     | undefined;

  //   if (breakdownType !== 'none') {
  //     breakdownResult = Object.entries(breakdownAccumulator).map(
  //       ([interval, acc]) => ({
  //         interval,
  //         values: {
  //           CHCT1: acc.CHCT1.count > 0 ? acc.CHCT1.sum / acc.CHCT1.count : 0,
  //           CHCT2: acc.CHCT2.count > 0 ? acc.CHCT2.sum / acc.CHCT2.count : 0,
  //           CT1: acc.CT1.count > 0 ? acc.CT1.sum / acc.CT1.count : 0,
  //           CT2: acc.CT2.count > 0 ? acc.CT2.sum / acc.CT2.count : 0,
  //         },
  //       }),
  //     );

  //     // Sort chronologically
  //     breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
  //   }

  //   return {
  //     overall: overallResult,
  //     breakdown: breakdownResult,
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

  // ✅ UPDATED calculateRangeByTower (label instead of interval)
  static calculateRangeByTower(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none',
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      label: string;
      values: { [towerId: string]: number };
    }>;
  } {
    // Initialize accumulators
    const overallAccumulator = {
      CHCT1: { sum: 0, count: 0 },
      CHCT2: { sum: 0, count: 0 },
      CT1: { sum: 0, count: 0 },
      CT2: { sum: 0, count: 0 },
    };

    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    // Helper to update accumulators
    const updateAccumulator = (acc: any, doc: any) => {
      // CHCT1
      if (
        typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
      ) {
        const diff = doc.CHCT1_TEMP_RTD_02_AI - doc.CHCT1_TEMP_RTD_01_AI;
        acc.CHCT1.sum += diff;
        acc.CHCT1.count++;
      }
      // CHCT2
      if (
        typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
      ) {
        const diff = doc.CHCT2_TEMP_RTD_02_AI - doc.CHCT2_TEMP_RTD_01_AI;
        acc.CHCT2.sum += diff;
        acc.CHCT2.count++;
      }
      // CT1
      if (
        typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CT1_TEMP_RTD_01_AI === 'number'
      ) {
        const diff = doc.CT1_TEMP_RTD_02_AI - doc.CT1_TEMP_RTD_01_AI;
        acc.CT1.sum += diff;
        acc.CT1.count++;
      }
      // CT2
      if (
        typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
        typeof doc.CT2_TEMP_RTD_01_AI === 'number'
      ) {
        const diff = doc.CT2_TEMP_RTD_02_AI - doc.CT2_TEMP_RTD_01_AI;
        acc.CT2.sum += diff;
        acc.CT2.count++;
      }
    };

    // Process each document
    for (const doc of data) {
      // Update overall accumulator
      updateAccumulator(overallAccumulator, doc);

      // Process breakdown if needed
      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        let intervalKey: string;

        switch (breakdownType) {
          case 'hour':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getDate()
              .toString()
              .padStart(2, '0')} ${date
              .getHours()
              .toString()
              .padStart(2, '0')}`;
            break;

          case '15min': {
            const minutes = Math.floor(date.getMinutes() / 15) * 15;
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getDate()
              .toString()
              .padStart(2, '0')} ${date
              .getHours()
              .toString()
              .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            break;
          }

          case 'day':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;

          case 'month':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}`;
            break;

          default:
            intervalKey = '';
        }

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {
            CHCT1: { sum: 0, count: 0 },
            CHCT2: { sum: 0, count: 0 },
            CT1: { sum: 0, count: 0 },
            CT2: { sum: 0, count: 0 },
          };
        }

        updateAccumulator(breakdownAccumulator[intervalKey], doc);
      }
    }

    // Calculate overall averages
    const overallResult = {
      CHCT1:
        overallAccumulator.CHCT1.count > 0
          ? overallAccumulator.CHCT1.sum / overallAccumulator.CHCT1.count
          : 0,
      CHCT2:
        overallAccumulator.CHCT2.count > 0
          ? overallAccumulator.CHCT2.sum / overallAccumulator.CHCT2.count
          : 0,
      CT1:
        overallAccumulator.CT1.count > 0
          ? overallAccumulator.CT1.sum / overallAccumulator.CT1.count
          : 0,
      CT2:
        overallAccumulator.CT2.count > 0
          ? overallAccumulator.CT2.sum / overallAccumulator.CT2.count
          : 0,
    };

    // Process breakdown if exists
    let breakdownResult:
      | Array<{ label: string; values: { [towerId: string]: number } }>
      | undefined;

    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => ({
          label: interval, // ✅ changed from interval → label
          values: {
            CHCT1: acc.CHCT1.count > 0 ? acc.CHCT1.sum / acc.CHCT1.count : 0,
            CHCT2: acc.CHCT2.count > 0 ? acc.CHCT2.sum / acc.CHCT2.count : 0,
            CT1: acc.CT1.count > 0 ? acc.CT1.sum / acc.CT1.count : 0,
            CT2: acc.CT2.count > 0 ? acc.CT2.sum / acc.CT2.count : 0,
          },
        }),
      );

      // Sort chronologically
      breakdownResult.sort((a, b) => a.label.localeCompare(b.label));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }

  static calculateApproachByTower(
    data: any[],
    wetBulb: number,
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    // Initialize accumulators
    const overallAccumulator = {
      CHCT1: { sum: 0, count: 0 },
      CHCT2: { sum: 0, count: 0 },
      CT1: { sum: 0, count: 0 },
      CT2: { sum: 0, count: 0 },
    };

    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    // Helper to update accumulators
    const updateAccumulator = (acc: any, doc: any) => {
      // CHCT1
      if (typeof doc.CHCT1_TEMP_RTD_01_AI === 'number') {
        const approach = doc.CHCT1_TEMP_RTD_01_AI - wetBulb;
        acc.CHCT1.sum += approach;
        acc.CHCT1.count++;
      }

      // CHCT2
      if (typeof doc.CHCT2_TEMP_RTD_01_AI === 'number') {
        const approach = doc.CHCT2_TEMP_RTD_01_AI - wetBulb;
        acc.CHCT2.sum += approach;
        acc.CHCT2.count++;
      }

      // CT1
      if (typeof doc.CT1_TEMP_RTD_01_AI === 'number') {
        const approach = doc.CT1_TEMP_RTD_01_AI - wetBulb;
        acc.CT1.sum += approach;
        acc.CT1.count++;
      }

      // CT2
      if (typeof doc.CT2_TEMP_RTD_01_AI === 'number') {
        const approach = doc.CT2_TEMP_RTD_01_AI - wetBulb;
        acc.CT2.sum += approach;
        acc.CT2.count++;
      }
    };

    // Process each document
    for (const doc of data) {
      // Update overall accumulator
      updateAccumulator(overallAccumulator, doc);

      // Process breakdown if needed
      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        let intervalKey: string;

        switch (breakdownType) {
          case 'hour':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}`;
            break;
          case 'day':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;
          case 'month':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          default:
            intervalKey = '';
        }

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {
            CHCT1: { sum: 0, count: 0 },
            CHCT2: { sum: 0, count: 0 },
            CT1: { sum: 0, count: 0 },
            CT2: { sum: 0, count: 0 },
          };
        }

        updateAccumulator(breakdownAccumulator[intervalKey], doc);
      }
    }

    // Calculate overall averages
    const overallResult = {
      CHCT1:
        overallAccumulator.CHCT1.count > 0
          ? overallAccumulator.CHCT1.sum / overallAccumulator.CHCT1.count
          : 0,
      CHCT2:
        overallAccumulator.CHCT2.count > 0
          ? overallAccumulator.CHCT2.sum / overallAccumulator.CHCT2.count
          : 0,
      CT1:
        overallAccumulator.CT1.count > 0
          ? overallAccumulator.CT1.sum / overallAccumulator.CT1.count
          : 0,
      CT2:
        overallAccumulator.CT2.count > 0
          ? overallAccumulator.CT2.sum / overallAccumulator.CT2.count
          : 0,
    };

    // Process breakdown if exists
    let breakdownResult:
      | Array<{ interval: string; values: { [towerId: string]: number } }>
      | undefined;

    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => ({
          interval,
          values: {
            CHCT1: acc.CHCT1.count > 0 ? acc.CHCT1.sum / acc.CHCT1.count : 0,
            CHCT2: acc.CHCT2.count > 0 ? acc.CHCT2.sum / acc.CHCT2.count : 0,
            CT1: acc.CT1.count > 0 ? acc.CT1.sum / acc.CT1.count : 0,
            CT2: acc.CT2.count > 0 ? acc.CT2.sum / acc.CT2.count : 0,
          },
        }),
      );

      // Sort chronologically
      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }

  static calculateAverageApproachByInterval(
    data: any[],
    wetBulb: number,
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towerType: 'CHCT' | 'CT' | 'all' = 'all',
  ): Array<{ interval: string; averageApproach: number }> {
    // if (breakdownType === 'none') {
    //   throw new Error('Breakdown type cannot be "none" for interval grouping');
    // }

    const towerFieldsMap = {
      CHCT: ['CHCT1_TEMP_RTD_01_AI', 'CHCT2_TEMP_RTD_01_AI'],
      CT: ['CT1_TEMP_RTD_01_AI', 'CT2_TEMP_RTD_01_AI'],
      all: [
        'CHCT1_TEMP_RTD_01_AI',
        'CHCT2_TEMP_RTD_01_AI',
        'CT1_TEMP_RTD_01_AI',
        'CT2_TEMP_RTD_01_AI',
      ],
    };

    const selectedFields = towerFieldsMap[towerType];

    const intervalAccumulator: Record<
      string,
      { sumApproach: number; count: number }
    > = {};

    for (const doc of data) {
      if (!doc.timestamp) continue;
      const date = new Date(doc.timestamp);

      let intervalKey: string;
      switch (breakdownType) {
        case 'hour':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(
              2,
              '0',
            )}-${date.getDate().toString().padStart(2, '0')} ${date
            .getHours()
            .toString()
            .padStart(2, '0')}`;
          break;
        case 'day':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          break;
        case 'month':
          intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
          break;
        default:
          throw new Error(`Unsupported breakdownType: ${breakdownType}`);
      }

      const towersApproach: number[] = [];

      for (const field of selectedFields) {
        if (typeof doc[field] === 'number') {
          towersApproach.push(doc[field] - wetBulb);
        }
      }

      if (towersApproach.length === 0) continue;

      const averageApproachForDoc =
        towersApproach.reduce((sum, val) => sum + val, 0) /
        towersApproach.length;

      if (!intervalAccumulator[intervalKey]) {
        intervalAccumulator[intervalKey] = { sumApproach: 0, count: 0 };
      }

      intervalAccumulator[intervalKey].sumApproach += averageApproachForDoc;
      intervalAccumulator[intervalKey].count++;
    }

    return Object.entries(intervalAccumulator)
      .map(([interval, acc]) => ({
        interval,
        averageApproach: acc.count > 0 ? acc.sumApproach / acc.count : 0,
      }))
      .sort((a, b) => a.interval.localeCompare(b.interval));
  }

  // static calculateWaterMetricsByTower(
  //   data: any[],
  //   breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none',
  // ): {
  //   overall: {
  //     [towerId: string]: {
  //       driftLoss: number;
  //       evaporationLoss: number;
  //       blowdownRate: number;
  //       makeupWater: number;
  //     };
  //   };
  //   breakdown?: Array<{
  //     interval: string;
  //     values: {
  //       [towerId: string]: {
  //         driftLoss: number;
  //         evaporationLoss: number;
  //         blowdownRate: number;
  //         makeupWater: number;
  //       };
  //     };
  //   }>;
  // } {
  //   const constant = 0.00085 * 1.8;
  //   const towers = ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

  //   // Initialize overall accumulator
  //   const overallAccumulator: any = {};
  //   towers.forEach((tower) => {
  //     overallAccumulator[tower] = {
  //       driftLoss: { sum: 0, count: 0 },
  //       evaporationLoss: { sum: 0, count: 0 },
  //       blowdownRate: { sum: 0, count: 0 },
  //       makeupWater: { sum: 0, count: 0 },
  //     };
  //   });

  //   // Initialize breakdown accumulator
  //   const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

  //   // Helper to calculate metrics
  //   const calculateLosses = (flow: number, hot: number, cold: number) => {
  //     const drift = 0.0005 * flow;
  //     const evap = constant * flow * (hot - cold);
  //     const blowdown = evap / 6;
  //     const makeup = drift + evap + blowdown;
  //     return { drift, evap, blowdown, makeup };
  //   };

  //   // Helper to update accumulator
  //   const updateAccumulator = (acc: any, doc: any, tower: string) => {
  //     const flowField = `${tower}_FM_02_FR`;
  //     const hotField = `${tower}_TEMP_RTD_02_AI`;
  //     const coldField = `${tower}_TEMP_RTD_01_AI`;

  //     if (
  //       typeof doc[flowField] === 'number' &&
  //       typeof doc[hotField] === 'number' &&
  //       typeof doc[coldField] === 'number'
  //     ) {
  //       const { drift, evap, blowdown, makeup } = calculateLosses(
  //         doc[flowField],
  //         doc[hotField],
  //         doc[coldField],
  //       );

  //       acc[tower].driftLoss.sum += drift;
  //       acc[tower].driftLoss.count++;
  //       acc[tower].evaporationLoss.sum += evap;
  //       acc[tower].evaporationLoss.count++;
  //       acc[tower].blowdownRate.sum += blowdown;
  //       acc[tower].blowdownRate.count++;
  //       acc[tower].makeupWater.sum += makeup;
  //       acc[tower].makeupWater.count++;
  //     }
  //   };

  //   // Process each document
  //   for (const doc of data) {
  //     // Update overall metrics
  //     towers.forEach((tower) =>
  //       updateAccumulator(overallAccumulator, doc, tower),
  //     );

  //     // Process breakdown if needed
  //     if (breakdownType !== 'none' && doc.timestamp) {
  //       const date = new Date(doc.timestamp);
  //       let intervalKey: string;

  //       switch (breakdownType) {
  //         case 'hour':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
  //             .toString()
  //             .padStart(2, '0')}-${date
  //             .getDate()
  //             .toString()
  //             .padStart(
  //               2,
  //               '0',
  //             )} ${date.getHours().toString().padStart(2, '0')}`;
  //           break;

  //         case '15min': {
  //           const minutes = Math.floor(date.getMinutes() / 15) * 15; // 0, 15, 30, 45
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
  //             .toString()
  //             .padStart(2, '0')}-${date
  //             .getDate()
  //             .toString()
  //             .padStart(2, '0')} ${date
  //             .getHours()
  //             .toString()
  //             .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  //           break;
  //         }

  //         case 'day':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
  //             .toString()
  //             .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  //           break;

  //         case 'month':
  //           intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
  //             .toString()
  //             .padStart(2, '0')}`;
  //           break;

  //         default:
  //           intervalKey = '';
  //       }

  //       if (!breakdownAccumulator[intervalKey]) {
  //         breakdownAccumulator[intervalKey] = {};
  //         towers.forEach((tower) => {
  //           breakdownAccumulator[intervalKey][tower] = {
  //             driftLoss: { sum: 0, count: 0 },
  //             evaporationLoss: { sum: 0, count: 0 },
  //             blowdownRate: { sum: 0, count: 0 },
  //             makeupWater: { sum: 0, count: 0 },
  //           };
  //         });
  //       }

  //       towers.forEach((tower) =>
  //         updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
  //       );
  //     }
  //   }

  //   // Calculate overall averages
  //   const overallResult: any = {};
  //   towers.forEach((tower) => {
  //     overallResult[tower] = {
  //       driftLoss:
  //         overallAccumulator[tower].driftLoss.count > 0
  //           ? overallAccumulator[tower].driftLoss.sum /
  //             overallAccumulator[tower].driftLoss.count
  //           : 0,
  //       evaporationLoss:
  //         overallAccumulator[tower].evaporationLoss.count > 0
  //           ? overallAccumulator[tower].evaporationLoss.sum /
  //             overallAccumulator[tower].evaporationLoss.count
  //           : 0,
  //       blowdownRate:
  //         overallAccumulator[tower].blowdownRate.count > 0
  //           ? overallAccumulator[tower].blowdownRate.sum /
  //             overallAccumulator[tower].blowdownRate.count
  //           : 0,
  //       makeupWater:
  //         overallAccumulator[tower].makeupWater.count > 0
  //           ? overallAccumulator[tower].makeupWater.sum /
  //             overallAccumulator[tower].makeupWater.count
  //           : 0,
  //     };
  //   });

  //   // Process breakdown if exists
  //   let breakdownResult: Array<{ interval: string; values: any }> | undefined;

  //   if (breakdownType !== 'none') {
  //     breakdownResult = Object.entries(breakdownAccumulator).map(
  //       ([interval, acc]) => {
  //         const values: any = {};
  //         towers.forEach((tower) => {
  //           values[tower] = {
  //             driftLoss:
  //               acc[tower].driftLoss.count > 0
  //                 ? acc[tower].driftLoss.sum / acc[tower].driftLoss.count
  //                 : 0,
  //             evaporationLoss:
  //               acc[tower].evaporationLoss.count > 0
  //                 ? acc[tower].evaporationLoss.sum /
  //                   acc[tower].evaporationLoss.count
  //                 : 0,
  //             blowdownRate:
  //               acc[tower].blowdownRate.count > 0
  //                 ? acc[tower].blowdownRate.sum / acc[tower].blowdownRate.count
  //                 : 0,
  //             makeupWater:
  //               acc[tower].makeupWater.count > 0
  //                 ? acc[tower].makeupWater.sum / acc[tower].makeupWater.count
  //                 : 0,
  //           };
  //         });
  //         return { interval, values };
  //       },
  //     );

  //     // Sort chronologically
  //     breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
  //   }

  //   return {
  //     overall: overallResult,
  //     breakdown: breakdownResult,
  //   };
  // }

  // ======================== SERVICE FUNCTION ========================
  mongoDateFilter: any;
  DashboardModel: any;

  async getDashboardDataChart17(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT' | 'CT' | 'all';
    interval?: 'hour' | '15min'; // ✅ custom interval
  }) {
    const query: any = {};
    let startDate: Date = new Date();
    let endDate: Date = new Date();

    if (dto.date) {
      if (!this.mongoDateFilter) throw new Error('mongoDateFilter is not set');
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
      startDate = new Date(dto.date);
      endDate = new Date(dto.date);
    } else if (dto.range) {
      try {
        if (!this.mongoDateFilter)
          throw new Error('mongoDateFilter is not set');
        const rangeFilter = this.mongoDateFilter.getDateRangeFilter(dto.range);
        query.timestamp = rangeFilter;
        startDate = new Date(rangeFilter.$gte);
        endDate = new Date(rangeFilter.$lte);
      } catch (err: any) {
        console.error(
          '\n[ERROR] Date range filter error:',
          err?.message ?? err,
        );
      }
    } else if (dto.fromDate && dto.toDate) {
      startDate = new Date(dto.fromDate);
      endDate = new Date(dto.toDate);

      // ✅ Make endDate inclusive (full day)
      endDate.setHours(23, 59, 59, 999);

      if (!this.mongoDateFilter) throw new Error('mongoDateFilter is not set');
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

    // ✅ Support custom interval (hour / 15min)
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
    };
  }

  // ======================== TOWER DATA PROCESSOR ========================
  static calculateWaterMetricsByTower(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | '15min' | 'none' = 'none',
  ): {
    overall: {
      [towerId: string]: {
        driftLoss: number;
        evaporationLoss: number;
        blowdownRate: number;
        makeupWater: number;
      };
    };
    breakdown?: Array<{
      interval: string;
      values: {
        [towerId: string]: {
          driftLoss: number;
          evaporationLoss: number;
          blowdownRate: number;
          makeupWater: number;
        };
      };
    }>;
  } {
    const constant = 0.00085 * 1.8;
    const towers = ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    // Initialize overall accumulator
    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = {
        driftLoss: { sum: 0, count: 0 },
        evaporationLoss: { sum: 0, count: 0 },
        blowdownRate: { sum: 0, count: 0 },
        makeupWater: { sum: 0, count: 0 },
      };
    });

    // Initialize breakdown accumulator
    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    // Helper to calculate metrics
    const calculateLosses = (flow: number, hot: number, cold: number) => {
      const drift = 0.0005 * flow;
      const evap = constant * flow * (hot - cold);
      const blowdown = evap / 6;
      const makeup = drift + evap + blowdown;
      return { drift, evap, blowdown, makeup };
    };

    // Helper to update accumulator
    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const flowField = `${tower}_FM_02_FR`;
      const hotField = `${tower}_TEMP_RTD_02_AI`;
      const coldField = `${tower}_TEMP_RTD_01_AI`;

      if (
        typeof doc[flowField] === 'number' &&
        typeof doc[hotField] === 'number' &&
        typeof doc[coldField] === 'number'
      ) {
        const { drift, evap, blowdown, makeup } = calculateLosses(
          doc[flowField],
          doc[hotField],
          doc[coldField],
        );

        acc[tower].driftLoss.sum += drift;
        acc[tower].driftLoss.count++;
        acc[tower].evaporationLoss.sum += evap;
        acc[tower].evaporationLoss.count++;
        acc[tower].blowdownRate.sum += blowdown;
        acc[tower].blowdownRate.count++;
        acc[tower].makeupWater.sum += makeup;
        acc[tower].makeupWater.count++;
      }
    };

    // Process each document
    for (const doc of data) {
      // Update overall metrics
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      // Process breakdown if needed
      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        let intervalKey: string;

        switch (breakdownType) {
          case 'hour':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getDate()
              .toString()
              .padStart(
                2,
                '0',
              )} ${date.getHours().toString().padStart(2, '0')}`;
            break;

          case '15min': {
            const minutes = Math.floor(date.getMinutes() / 15) * 15; // 0, 15, 30, 45
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date
              .getDate()
              .toString()
              .padStart(2, '0')} ${date
              .getHours()
              .toString()
              .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            break;
          }

          case 'day':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;

          case 'month':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}`;
            break;

          default:
            intervalKey = '';
        }

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = {
              driftLoss: { sum: 0, count: 0 },
              evaporationLoss: { sum: 0, count: 0 },
              blowdownRate: { sum: 0, count: 0 },
              makeupWater: { sum: 0, count: 0 },
            };
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    // Calculate overall averages
    const overallResult: any = {};
    towers.forEach((tower) => {
      overallResult[tower] = {
        driftLoss:
          overallAccumulator[tower].driftLoss.count > 0
            ? overallAccumulator[tower].driftLoss.sum /
              overallAccumulator[tower].driftLoss.count
            : 0,
        evaporationLoss:
          overallAccumulator[tower].evaporationLoss.count > 0
            ? overallAccumulator[tower].evaporationLoss.sum /
              overallAccumulator[tower].evaporationLoss.count
            : 0,
        blowdownRate:
          overallAccumulator[tower].blowdownRate.count > 0
            ? overallAccumulator[tower].blowdownRate.sum /
              overallAccumulator[tower].blowdownRate.count
            : 0,
        makeupWater:
          overallAccumulator[tower].makeupWater.count > 0
            ? overallAccumulator[tower].makeupWater.sum /
              overallAccumulator[tower].makeupWater.count
            : 0,
      };
    });

    // Process breakdown if exists
    let breakdownResult: Array<{ interval: string; values: any }> | undefined;

    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => {
          const values: any = {};
          towers.forEach((tower) => {
            values[tower] = {
              driftLoss:
                acc[tower].driftLoss.count > 0
                  ? acc[tower].driftLoss.sum / acc[tower].driftLoss.count
                  : 0,
              evaporationLoss:
                acc[tower].evaporationLoss.count > 0
                  ? acc[tower].evaporationLoss.sum /
                    acc[tower].evaporationLoss.count
                  : 0,
              blowdownRate:
                acc[tower].blowdownRate.count > 0
                  ? acc[tower].blowdownRate.sum / acc[tower].blowdownRate.count
                  : 0,
              makeupWater:
                acc[tower].makeupWater.count > 0
                  ? acc[tower].makeupWater.sum / acc[tower].makeupWater.count
                  : 0,
            };
          });
          return { interval, values };
        },
      );

      // Sort chronologically
      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }

  static calculateCoolingCapacityByTower(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towers: string[] = ['CHCT1', 'CHCT2', 'CT1', 'CT2'],
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    const Cp = 4.186;
    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = { sum: 0, count: 0 };
    });

    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const flowField = `${tower}_FM_02_FR`;
      const hotField = `${tower}_TEMP_RTD_02_AI`;
      const coldField = `${tower}_TEMP_RTD_01_AI`;

      if (
        typeof doc[flowField] === 'number' &&
        typeof doc[hotField] === 'number' &&
        typeof doc[coldField] === 'number'
      ) {
        const capacity = Cp * doc[flowField] * (doc[hotField] - doc[coldField]);
        acc[tower].sum += capacity;
        acc[tower].count++;
      }
    };

    for (const doc of data) {
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        const intervalKey = TowerDataProcessor.getIntervalKey(
          date,
          breakdownType,
        );

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = { sum: 0, count: 0 };
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    const overallResult: any = {};
    towers.forEach((tower) => {
      overallResult[tower] =
        overallAccumulator[tower].count > 0
          ? overallAccumulator[tower].sum / overallAccumulator[tower].count
          : 0;
    });

    let breakdownResult: Array<{ interval: string; values: any }> | undefined;
    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => {
          const values: any = {};
          towers.forEach((tower) => {
            values[tower] =
              acc[tower].count > 0 ? acc[tower].sum / acc[tower].count : 0;
          });
          return { interval, values };
        },
      );
      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }

  static calculateFanSpeedByTower(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    const towers = ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    // Initialize overall accumulator
    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = { sum: 0, count: 0 };
    });

    // Initialize breakdown accumulator
    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    // Helper to update accumulator
    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const speedField = `${tower}_INV_01_SPD_AI`;

      if (typeof doc[speedField] === 'number') {
        acc[tower].sum += doc[speedField];
        acc[tower].count++;
      }
    };

    // Process each document
    for (const doc of data) {
      // Update overall metrics
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      // Process breakdown if needed
      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        let intervalKey: string;

        switch (breakdownType) {
          case 'hour':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}`;
            break;
          case 'day':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            break;
          case 'month':
            intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          default:
            intervalKey = '';
        }

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = { sum: 0, count: 0 };
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    // Calculate overall averages
    const overallResult: any = {};
    towers.forEach((tower) => {
      overallResult[tower] =
        overallAccumulator[tower].count > 0
          ? overallAccumulator[tower].sum / overallAccumulator[tower].count
          : 0;
    });

    // Process breakdown if exists
    let breakdownResult: Array<{ interval: string; values: any }> | undefined;

    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => {
          const values: any = {};
          towers.forEach((tower) => {
            values[tower] =
              acc[tower].count > 0 ? acc[tower].sum / acc[tower].count : 0;
          });
          return { interval, values };
        },
      );

      // Sort chronologically
      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }
  static calculateFanPowerByTower(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towerType: 'CHCT' | 'CT' | 'all' = 'all',
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    const allTowers = ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    const towers =
      towerType === 'CHCT'
        ? ['CHCT1', 'CHCT2']
        : towerType === 'CT'
          ? ['CT1', 'CT2']
          : allTowers;

    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = 0;
    });

    const breakdownAccumulator: Record<string, { [towerId: string]: number }> =
      {};

    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const powerField = `${tower}_EM01_ActivePower_Total_kW`;

      if (typeof doc[powerField] === 'number') {
        acc[tower] += doc[powerField];
      }
    };

    for (const doc of data) {
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        const intervalKey = TowerDataProcessor.getIntervalKey(
          date,
          breakdownType,
        );

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = 0;
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    const breakdownResult =
      breakdownType !== 'none'
        ? Object.entries(breakdownAccumulator)
            .map(([interval, values]) => ({ interval, values }))
            .sort((a, b) => a.interval.localeCompare(b.interval))
        : undefined;

    return {
      overall: overallAccumulator,
      breakdown: breakdownResult,
    };
  }
  static calculateFanEnergyEfficiencyIndex(
    data: any[],
    breakdownType: 'hour' | 'day' | 'month' | 'none' = 'none',
    towerType: 'CHCT' | 'CT' | 'all' = 'all',
  ): {
    overall: { [towerId: string]: number };
    breakdown?: Array<{
      interval: string;
      values: { [towerId: string]: number };
    }>;
  } {
    const towers =
      towerType === 'CHCT'
        ? ['CHCT1', 'CHCT2']
        : towerType === 'CT'
          ? ['CT1', 'CT2']
          : ['CHCT1', 'CHCT2', 'CT1', 'CT2'];

    // Instead of sum of FEEI and count,
    // keep track of total fan power and total cooling capacity for weighted avg
    const overallAccumulator: any = {};
    towers.forEach((tower) => {
      overallAccumulator[tower] = { totalPower: 0, totalCoolingCapacity: 0 };
    });

    const breakdownAccumulator: Record<string, typeof overallAccumulator> = {};

    const Cp = 4.186;

    const updateAccumulator = (acc: any, doc: any, tower: string) => {
      const flowField = `${tower}_FM_02_FR`;
      const hotField = `${tower}_TEMP_RTD_02_AI`;
      const coldField = `${tower}_TEMP_RTD_01_AI`;
      const powerField = `${tower}_EM01_ActivePower_Total_kW`;

      if (
        typeof doc[flowField] === 'number' &&
        typeof doc[hotField] === 'number' &&
        typeof doc[coldField] === 'number' &&
        typeof doc[powerField] === 'number'
      ) {
        const coolingCapacity =
          Cp * doc[flowField] * (doc[hotField] - doc[coldField]);
        const power = doc[powerField];

        if (coolingCapacity > 0) {
          // Instead of calculating FEEI here, accumulate totals for weighted avg later
          acc[tower].totalPower += power;
          acc[tower].totalCoolingCapacity += coolingCapacity;
        }
      }
    };

    for (const doc of data) {
      towers.forEach((tower) =>
        updateAccumulator(overallAccumulator, doc, tower),
      );

      if (breakdownType !== 'none' && doc.timestamp) {
        const date = new Date(doc.timestamp);
        const intervalKey = TowerDataProcessor.getIntervalKey(
          date,
          breakdownType,
        );

        if (!breakdownAccumulator[intervalKey]) {
          breakdownAccumulator[intervalKey] = {};
          towers.forEach((tower) => {
            breakdownAccumulator[intervalKey][tower] = {
              totalPower: 0,
              totalCoolingCapacity: 0,
            };
          });
        }

        towers.forEach((tower) =>
          updateAccumulator(breakdownAccumulator[intervalKey], doc, tower),
        );
      }
    }

    // Now calculate weighted FEEI: totalPower / totalCoolingCapacity * 100 (if you want percentage)
    const overallResult: any = {};
    towers.forEach((tower) => {
      const acc = overallAccumulator[tower];
      overallResult[tower] =
        acc.totalCoolingCapacity > 0
          ? (acc.totalPower / acc.totalCoolingCapacity) * 100
          : 0;
    });

    let breakdownResult: Array<{ interval: string; values: any }> | undefined;
    if (breakdownType !== 'none') {
      breakdownResult = Object.entries(breakdownAccumulator).map(
        ([interval, acc]) => {
          const values: any = {};
          towers.forEach((tower) => {
            const towerAcc = acc[tower];
            values[tower] =
              towerAcc.totalCoolingCapacity > 0
                ? (towerAcc.totalPower / towerAcc.totalCoolingCapacity) * 100
                : 0;
          });
          return { interval, values };
        },
      );

      breakdownResult.sort((a, b) => a.interval.localeCompare(b.interval));
    }

    return {
      overall: overallResult,
      breakdown: breakdownResult,
    };
  }
  static calculateTowerUtilisationRate(
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
    ).map((b) => ({
      label: b.timestamp,
      value: 0,
    }));

    const groupMap = new Map<string, { runtime: number; total: number }>();
    let totalRuntime = 0;
    let totalAvailable = 0;

    for (const doc of data) {
      const docDate = new Date(doc.timestamp);
      const label = this.getGroupKey(docDate, groupBy);

      if (!groupMap.has(label)) {
        groupMap.set(label, { runtime: 0, total: 0 });
      }
      const group = groupMap.get(label)!;

      let isRunning = false;

      if (towerType === 'CHCT' || towerType === 'all') {
        isRunning ||= (doc.CHCT1_INV_01_SPD_AI ?? 0) > 0;
        isRunning ||= (doc.CHCT2_INV_01_SPD_AI ?? 0) > 0;
      }

      if (towerType === 'CT' || towerType === 'all') {
        isRunning ||= (doc.CT1_INV_01_SPD_AI ?? 0) > 0;
        isRunning ||= (doc.CT2_INV_01_SPD_AI ?? 0) > 0;
      }

      if (isRunning) group.runtime++;
      group.total++;

      totalRuntime += isRunning ? 1 : 0;
      totalAvailable++;
    }

    const grouped = emptyBuckets.map((b) => {
      if (groupMap.has(b.label)) {
        const g = groupMap.get(b.label)!;
        return {
          label: b.label,
          value: +(g.total > 0 ? g.runtime / g.total : 0).toFixed(3),
        };
      }
      return b;
    });

    const overallAverage =
      totalAvailable > 0 ? +(totalRuntime / totalAvailable).toFixed(3) : 0;

    return {
      grouped,
      overallAverage,
    };
  }
  static calculateHeatRejectRate(
    data: any[],
    towerType: 'CHCT' | 'CT' | 'all',
    groupBy: 'hour' | 'day' | 'month',
    startDate: Date,
    endDate: Date,
  ) {
    const rho = 1000;
    const Cp = 4.186;

    const buckets = this.generateEmptyBuckets(startDate, endDate, groupBy).map(
      (b) => ({
        label: b.timestamp,
        value: 0,
      }),
    );

    const groupMap = new Map<string, { sum: number; count: number }>();

    for (const doc of data) {
      const docDate = new Date(doc.timestamp);
      const label = this.getGroupKey(docDate, groupBy);
      if (!groupMap.has(label)) groupMap.set(label, { sum: 0, count: 0 });
      const group = groupMap.get(label)!;

      const compute = (flow: number, hot: number, cold: number) =>
        rho * flow * Cp * (hot - cold);

      let total = 0;

      if (towerType === 'CHCT' || towerType === 'all') {
        if (
          typeof doc.CHCT1_FM_02_FR === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT1_TEMP_RTD_01_AI === 'number'
        ) {
          total += compute(
            doc.CHCT1_FM_02_FR,
            doc.CHCT1_TEMP_RTD_02_AI,
            doc.CHCT1_TEMP_RTD_01_AI,
          );
        }
        if (
          typeof doc.CHCT2_FM_02_FR === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CHCT2_TEMP_RTD_01_AI === 'number'
        ) {
          total += compute(
            doc.CHCT2_FM_02_FR,
            doc.CHCT2_TEMP_RTD_02_AI,
            doc.CHCT2_TEMP_RTD_01_AI,
          );
        }
      }

      if (towerType === 'CT' || towerType === 'all') {
        if (
          typeof doc.CT1_FM_02_FR === 'number' &&
          typeof doc.CT1_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT1_TEMP_RTD_01_AI === 'number'
        ) {
          total += compute(
            doc.CT1_FM_02_FR,
            doc.CT1_TEMP_RTD_02_AI,
            doc.CT1_TEMP_RTD_01_AI,
          );
        }
        if (
          typeof doc.CT2_FM_02_FR === 'number' &&
          typeof doc.CT2_TEMP_RTD_02_AI === 'number' &&
          typeof doc.CT2_TEMP_RTD_01_AI === 'number'
        ) {
          total += compute(
            doc.CT2_FM_02_FR,
            doc.CT2_TEMP_RTD_02_AI,
            doc.CT2_TEMP_RTD_01_AI,
          );
        }
      }

      if (total > 0) {
        group.sum += total;
        group.count++;
      }
    }

    return buckets.map((b) =>
      groupMap.has(b.label)
        ? {
            label: b.label,
            value: +(
              groupMap.get(b.label)!.sum / groupMap.get(b.label)!.count
            ).toFixed(2),
          }
        : b,
    );
  }

  // static getGroupKey(
  //   date: Date,
  //   groupBy: 'hour' | 'day' | 'week' | 'month',
  // ): string {
  //   switch (groupBy) {
  //     case 'hour':
  //       return format(date, 'yyyy-MM-dd HH:00');
  //     case 'day':
  //       return format(date, 'yyyy-MM-dd');
  //     case 'week':
  //       return format(date, "yyyy-'W'II"); // ISO week format
  //     case 'month':
  //       return format(date, 'yyyy-MM');
  //     default:
  //       return format(date, 'yyyy-MM-dd');
  //   }
  // }
}
