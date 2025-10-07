import { DateTime } from 'luxon';

export class RangeService {
  private static tz = 'Asia/Karachi';
  private static dayStartHour = 6;

  // ------------------------
  // Utility: 6AM-based shift
  // ------------------------
  private static shiftToDayStart(dt: DateTime) {
    return dt.minus({ hours: this.dayStartHour });
  }

  // ------------------------
  // Group key generator (6AM operational day)
  // ------------------------
  private static getGroupKey(
    timestamp: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ): string {
    let dt = DateTime.fromISO(timestamp, { zone: this.tz });
    let shifted = this.shiftToDayStart(dt);

    switch (interval) {
      case '15min': {
        const mins = Math.floor(shifted.minute / 15) * 15;
        shifted = shifted.set({ minute: mins, second: 0, millisecond: 0 });
        return shifted
          .plus({ hours: this.dayStartHour })
          .toFormat('yyyy-MM-dd HH:mm');
      }
      case 'hour': {
        shifted = shifted.set({ minute: 0, second: 0, millisecond: 0 });
        return shifted
          .plus({ hours: this.dayStartHour })
          .toFormat('yyyy-MM-dd HH:00');
      }
      case 'day': {
        shifted = shifted.startOf('day');
        return shifted
          .plus({ hours: this.dayStartHour })
          .toFormat('yyyy-MM-dd');
      }
      case 'month': {
        shifted = shifted.startOf('month');
        return shifted.toFormat('yyyy-MM');
      }
    }
  }

  // ------------------------
  // Generic calculation helper
  // ------------------------
  private static calculateGeneric(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
    fieldFn: (doc: any, tower: string) => number | null,
  ) {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<string, any> = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();
      for (const doc of data) {
        const val = fieldFn(doc, tower);
        if (val === null) continue;

        const groupKey = this.getGroupKey(doc.timestamp, interval);
        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += val;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([label, { sum, count }]) => ({
          label,
          value: count > 0 ? sum / count : 0,
        }));

      perTowerResults[tower] = { grouped };
    }

    return this.combineTowerResults(perTowerResults);
  }

  // ------------------------
  // Combine multi-tower results
  // ------------------------
  private static combineTowerResults(perTowerResults: Record<string, any>) {
    const grouped: { label: string; value: number }[] = [];
    const labels = new Set<string>();

    for (const tower of Object.keys(perTowerResults)) {
      for (const g of perTowerResults[tower].grouped) labels.add(g.label);
    }

    for (const label of Array.from(labels).sort()) {
      let sum = 0,
        count = 0;
      for (const tower of Object.keys(perTowerResults)) {
        const found = perTowerResults[tower].grouped.find(
          (x: any) => x.label === label,
        );
        if (found) {
          sum += found.value;
          count++;
        }
      }
      grouped.push({ label, value: count > 0 ? sum / count : 0 });
    }

    const overallAverage =
      grouped.reduce((a, b) => a + b.value, 0) / (grouped.length || 1);

    return { grouped, overallAverage };
  }

  // ------------------------
  // Tower key mapper
  // ------------------------
  static getTowerKeys(towerType: string) {
    if (towerType === 'all') return ['CT1', 'CT2', 'CHCT1', 'CHCT2'];
    if (towerType === 'CT') return ['CT1', 'CT2'];
    if (towerType === 'CHCT') return ['CHCT1', 'CHCT2'];
    return [towerType];
  }

  // ------------------------
  // Specific metrics
  // ------------------------

  // 🔹 Range = Hot - Cold
  static calculateRange(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];
      return typeof hot === 'number' && typeof cold === 'number'
        ? hot - cold
        : null;
    });
  }

  // 🔹 Approach = Cold - WetBulb
  static calculateApproach(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
    wetBulb = 25,
  ) {
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];
      return typeof cold === 'number' ? cold - wetBulb : null;
    });
  }

  // 🔹 Cooling Efficiency = ((Hot - Cold) / (Hot - WetBulb)) * 100
  static calculateCoolingEfficiency(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
    wetBulb = 25,
  ) {
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];
      if (typeof hot === 'number' && typeof cold === 'number') {
        const denom = hot - wetBulb;
        if (denom === 0) return null;
        return ((hot - cold) / denom) * 100;
      }
      return null;
    });
  }

  // 🔹 Cooling Capacity = Cp × Flow × (Hot - Cold)
  static calculateCoolingCapacity(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const Cp = 4.186;
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const flow = doc[`${tower}_FM_02_FR`];
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];
      if (
        typeof flow === 'number' &&
        typeof hot === 'number' &&
        typeof cold === 'number'
      ) {
        return Cp * flow * (hot - cold);
      }
      return null;
    });
  }

  // 🔹 Water Efficiency Index
  static calculateWaterEfficiencyIndex(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const REFERENCE_EFFICIENCY = 0.001;
    const Cp = 4.186;
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<
      string,
      { grouped: { label: string; value: number }[]; overallAverage: number }
    > = {};

    const parseDT = (ts: any) => {
      if (!ts) return DateTime.invalid('no ts');
      try {
        if (typeof ts === 'string')
          return DateTime.fromISO(ts, { zone: this.tz });
        if (typeof ts === 'number')
          return DateTime.fromMillis(ts, { zone: this.tz });
        if (ts.$date)
          return DateTime.fromJSDate(new Date(ts.$date), { zone: this.tz });
      } catch {
        return DateTime.invalid('bad');
      }
      return DateTime.invalid('unknown');
    };

    for (const tower of towerKeys) {
      const groups: Record<string, { total_kWh: number; total_L: number }> = {};
      let total_kWh_overall = 0;
      let total_L_overall = 0;

      for (const doc of data) {
        const flow = doc[`${tower}_FM_02_FR`];
        const hot = doc[`${tower}_TEMP_RTD_02_AI`];
        const cold = doc[`${tower}_TEMP_RTD_01_AI`];
        if (
          typeof flow !== 'number' ||
          typeof hot !== 'number' ||
          typeof cold !== 'number'
        )
          continue;

        const capacity_kW = (Cp * flow * (hot - cold)) / 3600;
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

        const dt = parseDT(doc.timestamp);
        if (!dt.isValid) continue;
        const groupKey = this.getGroupKey(dt.toISO(), interval);

        const kWh = capacity_kW;
        const liters = makeup_m3h * 1000;

        if (!groups[groupKey]) groups[groupKey] = { total_kWh: 0, total_L: 0 };
        groups[groupKey].total_kWh += kWh;
        groups[groupKey].total_L += liters;
        total_kWh_overall += kWh;
        total_L_overall += liters;
      }

      const groupedResults = Object.keys(groups)
        .sort()
        .map((key) => {
          const { total_kWh, total_L } = groups[key];
          if (total_L === 0) return { label: key, value: 0 };
          const actualEfficiency = total_kWh / total_L;
          const efficiencyPercent =
            (actualEfficiency / REFERENCE_EFFICIENCY) * 100;
          return {
            label: key,
            value: parseFloat(efficiencyPercent.toFixed(2)),
          };
        });

      const overallEfficiencyPercent =
        total_L_overall > 0
          ? (total_kWh_overall / total_L_overall / REFERENCE_EFFICIENCY) * 100
          : 0;

      perTowerResults[tower] = {
        grouped: groupedResults,
        overallAverage: parseFloat(overallEfficiencyPercent.toFixed(2)),
      };
    }

    return this.combineTowerResults(perTowerResults);
  }

  // 🔹 Water Consumption
  static calculateWaterConsumption(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const val = doc[`${tower}_FM_01_TOT`];
      return typeof val === 'number' ? val : null;
    });
  }

  // 🔹 Fan Speed (Average per tower)
  static calculateFanSpeed(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<
      string,
      { grouped: { label: string; value: number }[]; overallAverage: number }
    > = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<string, { sum: number; count: number }>();

      for (const doc of data) {
        const val = doc[`${tower}_INV_01_SPD_AI`];
        if (typeof val !== 'number') continue;

        const groupKey = this.getGroupKey(doc.timestamp, interval);
        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { sum: 0, count: 0 });
        const g = groupMap.get(groupKey)!;
        g.sum += val;
        g.count++;
      }

      const grouped = Array.from(groupMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([label, { sum, count }]) => ({
          label,
          value: count > 0 ? sum / count : 0,
        }));

      const overallAverage =
        grouped.reduce((a, b) => a + b.value, 0) / (grouped.length || 1);

      perTowerResults[tower] = { grouped, overallAverage };
    }

    return this.combineTowerResults(perTowerResults);
  }

  // 🔹 Fan Power Consumption = (A + B + C) phase-wise sum in kW
  static calculateFanPowerConsumption(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const a = doc[`${tower}_EM01_ActivePower_A_kW`];
      const b = doc[`${tower}_EM01_ActivePower_B_kW`];
      const c = doc[`${tower}_EM01_ActivePower_C_kW`];

      if (
        typeof a !== 'number' ||
        typeof b !== 'number' ||
        typeof c !== 'number'
      )
        return null;

      return a + b + c; // total fan power
    });
  }

  // 🔹 Fan Efficiency Index = Cooling Capacity (kW) / Fan Power (kW)
  // 🔹 Fan Efficiency Index = Total Cooling Capacity (kW) / Total Fan Power (kW)
  // static calculateFanEfficiencyIndex(
  //   data: any[],
  //   towerType: string,
  //   interval: '15min' | 'hour' | 'day' | 'month',
  // ) {
  //   const Cp = 4.186; // kJ/kg°C
  //   const towerKeys = this.getTowerKeys(towerType);
  //   const perTowerResults: Record<
  //     string,
  //     { grouped: { label: string; value: number }[]; overallAverage: number }
  //   > = {};

  //   const parseDT = (ts: any) => {
  //     if (!ts) return DateTime.invalid('no ts');
  //     try {
  //       if (typeof ts === 'string')
  //         return DateTime.fromISO(ts, { zone: this.tz });
  //       if (typeof ts === 'number')
  //         return DateTime.fromMillis(ts, { zone: this.tz });
  //       if (ts.$date)
  //         return DateTime.fromJSDate(new Date(ts.$date), { zone: this.tz });
  //     } catch {
  //       return DateTime.invalid('bad');
  //     }
  //     return DateTime.invalid('unknown');
  //   };

  //   for (const tower of towerKeys) {
  //     const groupMap = new Map<
  //       string,
  //       { totalCapacity: number; totalPower: number }
  //     >();
  //     let grandCapacity = 0;
  //     let grandPower = 0;

  //     for (const doc of data) {
  //       const flow = doc[`${tower}_FM_02_FR`];
  //       const hot = doc[`${tower}_TEMP_RTD_02_AI`];
  //       const cold = doc[`${tower}_TEMP_RTD_01_AI`];
  //       const a = doc[`${tower}_EM01_ActivePower_A_kW`];
  //       const b = doc[`${tower}_EM01_ActivePower_B_kW`];
  //       const c = doc[`${tower}_EM01_ActivePower_C_kW`];

  //       if (
  //         typeof flow !== 'number' ||
  //         typeof hot !== 'number' ||
  //         typeof cold !== 'number' ||
  //         typeof a !== 'number' ||
  //         typeof b !== 'number' ||
  //         typeof c !== 'number'
  //       )
  //         continue;

  //       // Original formula without /3600
  //       const capacity = Cp * flow * (hot - cold); // kW
  //       const power = a + b + c;

  //       if (power <= 0 || !Number.isFinite(capacity)) continue;

  //       const dt = parseDT(doc.timestamp);
  //       if (!dt.isValid) continue;

  //       const groupKey = this.getGroupKey(dt.toISO(), interval);

  //       if (!groupMap.has(groupKey))
  //         groupMap.set(groupKey, { totalCapacity: 0, totalPower: 0 });

  //       const g = groupMap.get(groupKey)!;
  //       g.totalCapacity += capacity;
  //       g.totalPower += power;

  //       grandCapacity += capacity;
  //       grandPower += power;
  //     }

  //     // Original grouping logic: totalCapacity / totalPower for each group
  //     const grouped = Array.from(groupMap.entries())
  //       .sort(([a], [b]) => (a > b ? 1 : -1))
  //       .map(([label, { totalCapacity, totalPower }]) => ({
  //         label,
  //         value: totalPower > 0 ? totalCapacity / totalPower : 0,
  //       }));

  //     const overallAverage = grandPower > 0 ? grandCapacity / grandPower : 0;

  //     perTowerResults[tower] = { grouped, overallAverage };
  //   }

  //   return this.combineTowerResults(perTowerResults);
  // }

  // 🔹 Fan Efficiency Index = Total Cooling Capacity (kW) / Total Fan Power (kW)
  static calculateFanEfficiencyIndex(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const Cp = 4.186; // kJ/kg°C
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<
      string,
      { grouped: { label: string; value: number }[]; overallAverage: number }
    > = {};

    for (const tower of towerKeys) {
      const groupMap = new Map<
        string,
        { totalCapacity: number; totalPower: number }
      >();
      let grandCapacity = 0;
      let grandPower = 0;

      for (const doc of data) {
        const flow = doc[`${tower}_FM_02_FR`];
        const hot = doc[`${tower}_TEMP_RTD_02_AI`];
        const cold = doc[`${tower}_TEMP_RTD_01_AI`];
        const a = doc[`${tower}_EM01_ActivePower_A_kW`];
        const b = doc[`${tower}_EM01_ActivePower_B_kW`];
        const c = doc[`${tower}_EM01_ActivePower_C_kW`];

        if (
          typeof flow !== 'number' ||
          typeof hot !== 'number' ||
          typeof cold !== 'number' ||
          typeof a !== 'number' ||
          typeof b !== 'number' ||
          typeof c !== 'number'
        )
          continue;

        // Original formula - direct calculation
        const capacity = Cp * flow * (hot - cold); // kW
        const power = a + b + c;

        if (power <= 0 || !Number.isFinite(capacity)) continue;

        // ✅ Use the same 6AM-based grouping as other methods
        const groupKey = this.getGroupKey(doc.timestamp, interval);

        if (!groupMap.has(groupKey))
          groupMap.set(groupKey, { totalCapacity: 0, totalPower: 0 });

        const g = groupMap.get(groupKey)!;
        g.totalCapacity += capacity;
        g.totalPower += power;

        grandCapacity += capacity;
        grandPower += power;
      }

      // Original grouping logic: totalCapacity / totalPower for each group
      const grouped = Array.from(groupMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([label, { totalCapacity, totalPower }]) => ({
          label,
          value: totalPower > 0 ? totalCapacity / totalPower : 0,
        }));

      const overallAverage = grandPower > 0 ? grandCapacity / grandPower : 0;

      perTowerResults[tower] = { grouped, overallAverage };
    }

    return this.combineTowerResults(perTowerResults);
  }

  // 🔹 Drift-to-Evaporation Ratio
  static calculateDriftToEvapRatio(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const driftConstant = 0.0005; // 0.05%
    const evapConstant = 0.00085 * 1.8;

    const calculateTowerRatio = (
      flow: number,
      hotTemp: number,
      coldTemp: number,
    ) => {
      const drift = driftConstant * flow;
      const evap = evapConstant * flow * (hotTemp - coldTemp);
      return evap > 0 ? drift / evap : null;
    };

    // Generic field function
    const fieldFn = (doc: any, tower: string) => {
      const flow = doc[`${tower}_FM_02_FR`];
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];

      if (
        typeof flow === 'number' &&
        typeof hot === 'number' &&
        typeof cold === 'number'
      ) {
        return calculateTowerRatio(flow, hot, cold);
      }
      return null;
    };

    return this.calculateGeneric(data, towerType, interval, fieldFn);
  }

  static calculateDriftLossRate(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const driftConstant = 0.0005; // 0.05%

    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const flow = doc[`${tower}_FM_02_FR`];
      if (typeof flow === 'number') {
        return driftConstant * flow;
      }
      return null;
    });
  }

  static calculateEvaporationLossRate(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const evapConstant = 0.00085 * 1.8;

    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const flow = doc[`${tower}_FM_02_FR`];
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];

      if (
        typeof flow === 'number' &&
        typeof hot === 'number' &&
        typeof cold === 'number'
      ) {
        return evapConstant * flow * (hot - cold);
      }
      return null;
    });
  }

  static calculateBlowdownRate(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const evapConstant = 0.00085 * 1.8;

    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const flow = doc[`${tower}_FM_02_FR`];
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];

      if (
        typeof flow === 'number' &&
        typeof hot === 'number' &&
        typeof cold === 'number'
      ) {
        const evap = evapConstant * flow * (hot - cold);
        return evap / 6; // blowdown fraction
      }
      return null;
    });
  }

  static calculateMakeupWater(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
  ) {
    const evapConstant = 0.00085 * 1.8;
    const driftConstant = 0.0005;

    return this.calculateGeneric(data, towerType, interval, (doc, tower) => {
      const flow = doc[`${tower}_FM_02_FR`];
      const hot = doc[`${tower}_TEMP_RTD_02_AI`];
      const cold = doc[`${tower}_TEMP_RTD_01_AI`];

      if (
        typeof flow === 'number' &&
        typeof hot === 'number' &&
        typeof cold === 'number'
      ) {
        const evap = evapConstant * flow * (hot - cold);
        const blowdown = evap / 6;
        const drift = driftConstant * flow;
        return evap + blowdown + drift;
      }
      return null;
    });
  }

  // 🔹 Average Energy Usage (fixed 6AM delta offset)
  // static calculateAverageEnergyUsage(
  //   data: any[],
  //   towerType: string,
  //   interval: '15min' | 'hour' | 'day' | 'month',
  // ) {
  //   const towerKeys = this.getTowerKeys(towerType);
  //   const perTowerResults: Record<
  //     string,
  //     { grouped: { label: string; value: number }[]; overallAverage: number }
  //   > = {};

  //   const parseDT = (ts: any) => {
  //     if (!ts) return DateTime.invalid('no ts');
  //     try {
  //       if (typeof ts === 'string')
  //         return DateTime.fromISO(ts, { zone: this.tz });
  //       if (typeof ts === 'number')
  //         return DateTime.fromMillis(ts, { zone: this.tz });
  //       if (ts.$date)
  //         return DateTime.fromJSDate(new Date(ts.$date), { zone: this.tz });
  //     } catch {
  //       return DateTime.invalid('bad');
  //     }
  //     return DateTime.invalid('unknown');
  //   };

  //   const getHourGroupKey = (timestamp: string) => {
  //     const dt = DateTime.fromISO(timestamp, { zone: this.tz });
  //     return dt.startOf('hour').toFormat('yyyy-MM-dd HH:00');
  //   };

  //   for (const tower of towerKeys) {
  //     const groupMap = new Map<string, number>();
  //     const dailyTotals = new Map<string, number>();

  //     const sorted = [...data].sort((a, b) => {
  //       const da = parseDT(a.timestamp);
  //       const db = parseDT(b.timestamp);
  //       return da.toMillis() - db.toMillis();
  //     });

  //     let lastSeen: number | null = null;

  //     for (const doc of sorted) {
  //       const cur = doc[`${tower}_EM01_ActiveEnergy_Total_kWhh`];
  //       if (typeof cur !== 'number') continue;

  //       const dt = parseDT(doc.timestamp);
  //       if (!dt.isValid) continue;

  //       // 🧩 Skip first 6:00 reading of each day (baseline only)
  //       if (dt.hour === 6 && dt.minute === 0) {
  //         lastSeen = cur;
  //         continue;
  //       }

  //       if (lastSeen === null) {
  //         lastSeen = cur;
  //         continue;
  //       }

  //       const delta = cur - lastSeen;
  //       lastSeen = cur;
  //       if (!Number.isFinite(delta) || delta <= 0) continue;

  //       const hourKey =
  //         interval === 'hour'
  //           ? getHourGroupKey(dt.toISO())
  //           : this.getGroupKey(dt.toISO(), interval);
  //       const dayKey = dt.toFormat('yyyy-MM-dd');

  //       groupMap.set(hourKey, (groupMap.get(hourKey) ?? 0) + delta);
  //       dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + delta);
  //     }

  //     const grouped = Array.from(groupMap.entries())
  //       .sort(([a], [b]) => (a > b ? 1 : -1))
  //       .map(([label, value]) => ({ label, value }));

  //     const totalEnergy = Array.from(dailyTotals.values()).reduce(
  //       (a, b) => a + b,
  //       0,
  //     );
  //     const daysWithData = Array.from(dailyTotals.values()).filter(
  //       (v) => v > 0,
  //     ).length;
  //     const overallAverage = daysWithData > 0 ? totalEnergy / daysWithData : 0;

  //     perTowerResults[tower] = { grouped, overallAverage };
  //   }

  //   const combined = this.combineTowerResults(perTowerResults);

  //   const isCombinedType = ['CT', 'CHCT', 'all'].includes(towerType);
  //   if (isCombinedType) {
  //     const count = this.getTowerKeys(towerType).length;
  //     combined.grouped = combined.grouped.map((g) => ({
  //       label: g.label,
  //       value: g.value * count,
  //     }));
  //     combined.overallAverage *= count;
  //   }

  //   return combined;
  // }

  static calculateAverageEnergyUsage(
    data: any[],
    towerType: string,
    interval: '15min' | 'hour' | 'day' | 'month',
    averageType: 'hourly' | 'daily' = 'hourly', // New parameter
  ) {
    const towerKeys = this.getTowerKeys(towerType);
    const perTowerResults: Record<
      string,
      { grouped: { label: string; value: number }[]; overallAverage: number }
    > = {};

    const parseDT = (ts: any) => {
      if (!ts) return DateTime.invalid('no ts');
      try {
        if (typeof ts === 'string')
          return DateTime.fromISO(ts, { zone: this.tz });
        if (typeof ts === 'number')
          return DateTime.fromMillis(ts, { zone: this.tz });
        if (ts.$date)
          return DateTime.fromJSDate(new Date(ts.$date), { zone: this.tz });
      } catch {
        return DateTime.invalid('bad');
      }
      return DateTime.invalid('unknown');
    };

    const getHourGroupKey = (timestamp: string) => {
      const dt = DateTime.fromISO(timestamp, { zone: this.tz });
      return dt.startOf('hour').toFormat('yyyy-MM-dd HH:00');
    };

    for (const tower of towerKeys) {
      const groupMap = new Map<string, number>();
      const dailyTotals = new Map<string, number>();

      const sorted = [...data].sort(
        (a, b) =>
          parseDT(a.timestamp).toMillis() - parseDT(b.timestamp).toMillis(),
      );
      let lastSeen: number | null = null;

      for (const doc of sorted) {
        const fieldName = `${tower}_EM01_ActiveEnergy_Total_kWhh`;
        const cur = doc[fieldName];

        if (cur === undefined || typeof cur !== 'number') continue;

        const dt = parseDT(doc.timestamp);
        if (!dt.isValid) continue;

        if (lastSeen === null) {
          lastSeen = cur;
          continue;
        }

        const delta = cur - lastSeen;
        lastSeen = cur;

        if (!Number.isFinite(delta) || delta < 0) continue;

        const groupKey =
          interval === 'hour'
            ? getHourGroupKey(dt.toISO())
            : this.getGroupKey(dt.toISO(), interval);
        const dayKey = dt.toFormat('yyyy-MM-dd');

        groupMap.set(groupKey, (groupMap.get(groupKey) ?? 0) + delta);
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) ?? 0) + delta);
      }

      const grouped = Array.from(groupMap.entries())
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([label, value]) => ({ label, value }));

      let overallAverage = 0;

      if (averageType === 'hourly') {
        // Average per group (hourly/delta-based)
        overallAverage =
          grouped.reduce((sum, g) => sum + g.value, 0) / (grouped.length || 1);
      } else if (averageType === 'daily') {
        // Average per day
        const totalEnergy = Array.from(dailyTotals.values()).reduce(
          (a, b) => a + b,
          0,
        );
        const daysWithData = Array.from(dailyTotals.values()).filter(
          (v) => v > 0,
        ).length;
        overallAverage = daysWithData > 0 ? totalEnergy / daysWithData : 0;
      }

      perTowerResults[tower] = { grouped, overallAverage };
    }

    // Combine results across towers
    const combined = this.combineTowerResults(perTowerResults);

    // If combined tower type, multiply by number of towers
    if (['CT', 'CHCT', 'all'].includes(towerType)) {
      const count = this.getTowerKeys(towerType).length;
      combined.grouped = combined.grouped.map((g) => ({
        label: g.label,
        value: g.value * count,
      }));
      combined.overallAverage *= count;
    }

    return combined;
  }
}
