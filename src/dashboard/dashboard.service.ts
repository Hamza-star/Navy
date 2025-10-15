// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Inject, Injectable } from '@nestjs/common';
// import { Db } from 'mongodb';

// @Injectable()
// export class DashboardService {
//   private collection;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.collection = this.db.collection('navy');

//     // ⚡ Ensure indexes for fast queries
//     this.collection.createIndex({ timestamp: 1 });
//     this.collection.createIndex({ Genset_Run_SS: 1, timestamp: 1 });
//   }

//   // Configurable metrics
//   private METRIC_DEFINITIONS = {
//     load: (doc: any) =>
//       doc.Genset_Application_kW_Rating_PC2X
//         ? (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) * 100
//         : 0,
//     rpm: (doc: any) => doc.Averagr_Engine_Speed || 0,
//     runningHours: (doc: any) =>
//       +(doc.Engine_Running_Time_calculated / 60 || 0).toFixed(2),
//     fuelConsumed: (doc: any) => doc.Total_Fuel_Consumption_calculated || 0,
//     batteryVoltage: (doc: any) => doc.Battery_Voltage_calculated || 0,
//     powerFactor: (doc: any) => doc.Genset_Total_Power_Factor_calculated || 0,

//     // Phase Voltages
//     voltageL1: (doc: any) => doc.Genset_L1L2_Voltage || 0,
//     voltageL2: (doc: any) => doc.Genset_L2L3_Voltage || 0,
//     voltageL3: (doc: any) => doc.Genset_L3L1_Voltage || 0,

//     // Active Power
//     activePowerL1: (doc: any) => doc.Genset_L1_Active_Power || 0,
//     activePowerL2: (doc: any) => doc.Genset_L2_Active_Power || 0,
//     activePowerL3: (doc: any) => doc.Genset_L3_Active_Power || 0,
//   };

//   // Configurable charts
//   private CHART_DEFINITIONS = {
//     electricalStability: [
//       'Genset_L1L2_Voltage',
//       'Genset_L2L3_Voltage',
//       'Genset_L3L1_Voltage',
//       'Genset_Frequency_OP_calculated',
//     ],
//     loadSharing: [
//       'Genset_L1_Current',
//       'Genset_L2_Current',
//       'Genset_L3_Current',
//     ],
//     engineThermal: ['Coolant_Temperature', 'Oil_Temperature'],
//     lubrication: ['Oil_Pressure'],
//     fuelDemand: ['Fuel_Rate'],
//   };

//   // Main dashboard fetch
//   async getDashboardData(
//     mode: 'live' | 'historic' | 'range',
//     start?: string,
//     end?: string,
//   ) {
//     const query = this.buildQuery(mode, start, end);
//     const projection = this.getProjectionFields();
//     let data: any[] = [];

//     if (mode === 'live') {
//       data = await this.collection
//         .find({}, { projection })
//         .sort({ timestamp: -1 })
//         .limit(1)
//         .toArray();
//       if (!data.length) return { metrics: {}, charts: {} };
//       return {
//         metrics: this.mapMetrics(data[0]),
//         charts: this.mapCharts(data),
//       };
//     }

//     if (!query) return { metrics: {}, charts: {} };
//     data = await this.collection
//       .find(query, { projection })
//       .sort({ timestamp: 1 })
//       .toArray();
//     if (!data.length)
//       return {
//         metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
//         charts: {},
//       };

//     const latest = data[data.length - 1];
//     let metrics = this.mapMetrics(latest);

//     if (mode === 'range') {
//       metrics = {
//         ...metrics,
//         onDurationMinutes: this.calculateOnDuration(data),
//       };
//     }

//     return {
//       metrics,
//       charts: this.mapCharts(data),
//     };
//   }

//   // Metrics mapping
//   private mapMetrics(doc: any) {
//     const metrics: Record<string, number> = {};
//     for (const key in this.METRIC_DEFINITIONS) {
//       metrics[key] = +this.METRIC_DEFINITIONS[key](doc).toFixed(2);
//     }
//     return metrics;
//   }

//   // Charts mapping
//   private mapCharts(data: any[]) {
//     const charts: Record<string, any[]> = {};

//     for (const chartName in this.CHART_DEFINITIONS) {
//       charts[chartName] = data.map((d) => {
//         const entry: any = { time: d.timestamp };
//         this.CHART_DEFINITIONS[chartName].forEach((field) => {
//           entry[field] = d[field];
//         });
//         return entry;
//       });
//     }

//     // Current balance & neutral
//     charts.currentBalanceNeutral = data.map((d) => {
//       const IA = d.Genset_L1_Current || 0;
//       const IB = d.Genset_L2_Current || 0;
//       const IC = d.Genset_L3_Current || 0;
//       const avg = (IA + IB + IC) / 3 || 1;
//       const imbalance =
//         ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avg) * 100;
//       const IN = Math.sqrt(
//         IA ** 2 + IB ** 2 + IC ** 2 - IA * IB - IB * IC - IC * IA,
//       );
//       return {
//         time: d.timestamp,
//         imbalance: +imbalance.toFixed(2),
//         neutralCurrent: +IN.toFixed(2),
//       };
//     });

//     return charts;
//   }

//   // On-duration calculation
//   private calculateOnDuration(data: any[]): number {
//     if (data.length < 2) return 0;
//     let duration = 0;
//     for (let i = 1; i < data.length; i++) {
//       duration +=
//         (new Date(data[i].timestamp).getTime() -
//           new Date(data[i - 1].timestamp).getTime()) /
//         60000;
//     }
//     return +duration.toFixed(2);
//   }

//   // Query builder
//   private buildQuery(mode: string, start?: string, end?: string) {
//     const query: any = {};
//     if (mode === 'historic' && start && end)
//       query.timestamp = { $gte: start, $lte: end };
//     if (mode === 'range') query.Genset_Run_SS = 1;
//     if (start && end) query.timestamp = { $gte: start, $lte: end };
//     return query;
//   }

//   // Projection fields for fast query
//   private getProjectionFields() {
//     return {
//       timestamp: 1,
//       Genset_Total_kW: 1,
//       Genset_Application_kW_Rating_PC2X: 1,
//       Averagr_Engine_Speed: 1,
//       Genset_L1L2_Voltage: 1,
//       Genset_L2L3_Voltage: 1,
//       Genset_L3L1_Voltage: 1,
//       Genset_Frequency_OP_calculated: 1,
//       Genset_L1_Current: 1,
//       Genset_L2_Current: 1,
//       Genset_L3_Current: 1,
//       Coolant_Temperature: 1,
//       Oil_Temperature: 1,
//       Oil_Pressure: 1,
//       Fuel_Rate: 1,
//       Total_Fuel_Consumption_calculated: 1,
//       Engine_Running_Time_calculated: 1,
//       Battery_Voltage_calculated: 1,
//       Genset_Total_Power_Factor_calculated: 1,
//       Genset_Run_SS: 1,
//     };
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class DashboardService {
  private collection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.collection = this.db.collection('navy');

    // ⚡ Indexes for fast queries
    this.collection.createIndex({ timestamp: 1 });
    this.collection.createIndex({ Genset_Run_SS: 1, timestamp: 1 });
  }

  /** -------------------
   * Dashboard 1 - Basic
   * ------------------- */
  private DASH1_METRICS = {
    load: (doc: any) =>
      doc.Genset_Application_kW_Rating_PC2X
        ? (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) * 100
        : 0,
    rpm: (doc: any) => doc.Averagr_Engine_Speed || 0,
    runningHours: (doc: any) =>
      +(doc.Engine_Running_Time_calculated / 60 || 0).toFixed(2),
    fuelConsumed: (doc: any) => doc.Total_Fuel_Consumption_calculated || 0,
    batteryVoltage: (doc: any) => doc.Battery_Voltage_calculated || 0,
    powerFactor: (doc: any) => doc.Genset_Total_Power_Factor_calculated || 0,
  };

  private DASH1_CHARTS = {
    electricalStability: [
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_Frequency_OP_calculated',
    ],
    loadSharing: [
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
    ],
    engineThermal: ['Coolant_Temperature', 'Oil_Temperature'],
    lubrication: ['Oil_Pressure'],
    fuelDemand: ['Fuel_Rate'],
  };

  async getDashboard1Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const query = this.buildQuery(mode, start, end);
    const projection = this.getProjectionFieldsDashboard1();
    let data: any[] = [];

    if (mode === 'live') {
      data = await this.collection
        .find({}, { projection })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };
      return {
        metrics: this.mapMetrics(data[0], this.DASH1_METRICS),
        charts: this.mapCharts(data, this.DASH1_CHARTS),
      };
    }

    if (!query) return { metrics: {}, charts: {} };
    data = await this.collection
      .find(query, { projection })
      .sort({ timestamp: 1 })
      .toArray();
    if (!data.length)
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };

    const latest = data[data.length - 1];
    let metrics = this.mapMetrics(latest, this.DASH1_METRICS);
    if (mode === 'range')
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };

    return { metrics, charts: this.mapCharts(data, this.DASH1_CHARTS) };
  }

  /** -------------------
   * Dashboard 2 - Engineer Level
   * ------------------- */
  private DASH2_METRICS = {
    // Basic + 3 phase voltages + active power
    ...this.DASH1_METRICS,
    voltageL1: (doc: any) => doc.Genset_L1L2_Voltage || 0,
    voltageL2: (doc: any) => doc.Genset_L2L3_Voltage || 0,
    voltageL3: (doc: any) => doc.Genset_L3L1_Voltage || 0,
    activePowerL1: (doc: any) => doc.Genset_L1_Active_Power || 0,
    activePowerL2: (doc: any) => doc.Genset_L2_Active_Power || 0,
    activePowerL3: (doc: any) => doc.Genset_L3_Active_Power || 0,
  };

  private DASH2_CHARTS = {
    phaseBalanceEffectiveness: [
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
    ],
    voltageQualitySymmetry: [
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
    ],
    loadVsPowerFactor: ['LoadPercent', 'Genset_Total_Power_Factor_calculated'],
    electroMechanicalStress: ['ElectricalStress', 'LoadStress'],
    lossesThermalStress: ['PowerLossFactor', 'I2'],
    frequencyRegulationEffectiveness: [
      'Genset_Frequency_OP_calculated',
      'Frequency_Deviation_Rad',
    ],
  };

  async getDashboard2Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const query = this.buildQuery(mode, start, end);
    const projection = this.getProjectionFieldsDashboard2();
    let data: any[] = [];

    if (mode === 'live') {
      data = await this.collection
        .find({}, { projection })
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };
      return {
        metrics: this.mapMetricsDashboard2(data[0]),
        charts: this.mapChartsDashboard2(data),
      };
    }

    if (!query) return { metrics: {}, charts: {} };
    data = await this.collection
      .find(query, { projection })
      .sort({ timestamp: 1 })
      .toArray();
    if (!data.length)
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };

    const latest = data[data.length - 1];
    let metrics = this.mapMetricsDashboard2(latest);
    if (mode === 'range')
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };

    return { metrics, charts: this.mapChartsDashboard2(data) };
  }

  /** -------------------
   * Shared Helper Functions
   * ------------------- */
  private mapMetrics(doc: any, definitions: any) {
    const metrics: Record<string, number> = {};
    for (const key in definitions)
      metrics[key] = +definitions[key](doc).toFixed(2);
    return metrics;
  }

  private mapCharts(data: any[], definitions: any) {
    const charts: Record<string, any[]> = {};
    for (const chartName in definitions) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        definitions[chartName].forEach((field) => (entry[field] = d[field]));
        return entry;
      });
    }
    return charts;
  }

  // Dashboard2 specialized metrics mapping
  private mapMetricsDashboard2(doc: any) {
    const metrics = this.mapMetrics(doc, this.DASH2_METRICS);

    // Current imbalance
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const avgCurrent = (IA + IB + IC) / 3 || 1;
    metrics.currentImbalance = +(
      ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) *
      100
    ).toFixed(2);

    // Voltage imbalance
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
    metrics.voltageImbalance = +(
      ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) *
      100
    ).toFixed(2);

    // Power loss factor
    const pf = doc.Genset_Total_Power_Factor_calculated || 1;
    metrics.powerLossFactor = +(1 / (pf * pf)).toFixed(2);

    // Thermal stress
    const I2 = IA ** 2 + IB ** 2 + IC ** 2;
    const I2Rated = doc.I2Rated || 1;
    metrics.thermalStress = +(I2 / I2Rated).toFixed(2);

    return metrics;
  }

  private mapChartsDashboard2(data: any[]) {
    const charts: Record<string, any[]> = {};

    // Standard charts
    for (const chartName in this.DASH2_CHARTS) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        this.DASH2_CHARTS[chartName].forEach((field) => {
          switch (field) {
            case 'LoadPercent':
              entry[field] = d.Genset_Application_kW_Rating_PC2X
                ? (d.Genset_Total_kW / d.Genset_Application_kW_Rating_PC2X) *
                  100
                : 0;
              break;
            case 'PowerLossFactor':
              const pf = d.Genset_Total_Power_Factor_calculated || 1;
              entry[field] = 1 / (pf * pf);
              break;
            case 'I2':
              const IA = d.Genset_L1_Current || 0;
              const IB = d.Genset_L2_Current || 0;
              const IC = d.Genset_L3_Current || 0;
              entry[field] = IA ** 2 + IB ** 2 + IC ** 2;
              break;
            default:
              entry[field] = d[field];
          }
        });
        return entry;
      });
    }

    // Current & voltage imbalance
    charts.currentBalanceNeutral = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;
      const avgCurrent = (IA + IB + IC) / 3 || 1;
      const currentImbalance =
        ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) * 100;

      const VL1 = d.Genset_L1L2_Voltage || 0;
      const VL2 = d.Genset_L2L3_Voltage || 0;
      const VL3 = d.Genset_L3L1_Voltage || 0;
      const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
      const voltageImbalance =
        ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) * 100;

      return {
        time: d.timestamp,
        currentImbalance: +currentImbalance.toFixed(2),
        voltageImbalance: +voltageImbalance.toFixed(2),
      };
    });

    return charts;
  }

  /** -------------------
   * Shared helpers
   * ------------------- */
  private calculateOnDuration(data: any[]): number {
    if (data.length < 2) return 0;
    let duration = 0;
    for (let i = 1; i < data.length; i++) {
      duration +=
        (new Date(data[i].timestamp).getTime() -
          new Date(data[i - 1].timestamp).getTime()) /
        60000;
    }
    return +duration.toFixed(2);
  }

  private buildQuery(mode: string, start?: string, end?: string) {
    const query: any = {};
    if (mode === 'historic' && start && end)
      query.timestamp = { $gte: start, $lte: end };
    if (mode === 'range') query.Genset_Run_SS = 1;
    if (start && end) query.timestamp = { $gte: start, $lte: end };
    return query;
  }

  private getProjectionFieldsDashboard1() {
    return {
      timestamp: 1,
      Genset_Total_kW: 1,
      Genset_Application_kW_Rating_PC2X: 1,
      Averagr_Engine_Speed: 1,
      Genset_L1L2_Voltage: 1,
      Genset_L2L3_Voltage: 1,
      Genset_L3L1_Voltage: 1,
      Genset_Frequency_OP_calculated: 1,
      Genset_L1_Current: 1,
      Genset_L2_Current: 1,
      Genset_L3_Current: 1,
      Coolant_Temperature: 1,
      Oil_Temperature: 1,
      Oil_Pressure: 1,
      Fuel_Rate: 1,
      Total_Fuel_Consumption_calculated: 1,
      Engine_Running_Time_calculated: 1,
      Battery_Voltage_calculated: 1,
      Genset_Total_Power_Factor_calculated: 1,
      Genset_Run_SS: 1,
    };
  }

  private getProjectionFieldsDashboard2() {
    return {
      ...this.getProjectionFieldsDashboard1(),
      Genset_L1_Active_Power: 1,
      Genset_L2_Active_Power: 1,
      Genset_L3_Active_Power: 1,
      I2Rated: 1,
    };
  }
}
