// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Inject, Injectable } from '@nestjs/common';
// import { Db } from 'mongodb';

// @Injectable()
// export class DashboardService {
//   private collection;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.collection = this.db.collection('navy_historical');

//     // ⚡ Indexes for fast queries
//     this.collection.createIndex({ timestamp: 1 });
//     this.collection.createIndex({ Genset_Run_SS: 1, timestamp: 1 });
//   }

//   /** -------------------a
//    * Dashboard 1 - Basic
//    * ------------------- */
//   private DASH1_METRICS = {
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
//   };

//   private DASH1_CHARTS = {
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

//   private DASH3_CHARTS = {
//     intakeBoost: ['Intake_Manifold3_Temperature', 'Boost_Pressure'],
//   };

//   /** -------------------
//    *  ✅ LIVE = today's full data
//    *  ✅ RANGE = genset 1–6
//    * ------------------- */
//   async getDashboard1Data(
//     mode: 'live' | 'historic' | 'range',
//     start?: string,
//     end?: string,
//   ) {
//     const projection = this.getProjectionFieldsDashboard1();
//     let query = this.buildQuery(mode, start, end);
//     let data: any[] = [];

//     // ✅ LIVE MODE — today’s complete data
//     if (mode === 'live') {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//       query = { timestamp: { $gte: startOfDay.toISOString() } };
//       data = await this.collection
//         .find(query, { projection })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!data.length) return { metrics: {}, charts: {} };
//       const latest = data[data.length - 1];
//       return {
//         metrics: this.mapMetrics(latest, this.DASH1_METRICS),
//         charts: this.mapCharts(data, this.DASH1_CHARTS),
//       };
//     }

//     // HISTORIC & RANGE
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
//     let metrics = this.mapMetrics(latest, this.DASH1_METRICS);
//     if (mode === 'range')
//       metrics = {
//         ...metrics,
//         onDurationMinutes: this.calculateOnDuration(data),
//       };

//     return { metrics, charts: this.mapCharts(data, this.DASH1_CHARTS) };
//   }

//   /** -------------------
//    * Dashboard 2 - Engineer Level
//    * ------------------- */
//   private DASH2_CHARTS = {
//     phaseBalanceEffectiveness: [
//       'Genset_L1_Current',
//       'Genset_L2_Current',
//       'Genset_L3_Current',
//     ],
//     voltageQualitySymmetry: [
//       'Genset_L1L2_Voltage',
//       'Genset_L2L3_Voltage',
//       'Genset_L3L1_Voltage',
//     ],
//     loadVsPowerFactor: ['LoadPercent', 'Genset_Total_Power_Factor_calculated'],
//     electroMechanicalStress: ['ElectricalStress', 'LoadStress'],
//     lossesThermalStress: ['PowerLossFactor', 'I2'],
//     frequencyRegulationEffectiveness: [
//       'Genset_Frequency_OP_calculated',
//       'Frequency_Deviation_Rad',
//     ],
//   };

//   async getDashboard2Data(
//     mode: 'live' | 'historic' | 'range',
//     start?: string,
//     end?: string,
//   ) {
//     const projection = this.getProjectionFieldsDashboard2();
//     let query = this.buildQuery(mode, start, end);
//     let data: any[] = [];

//     // ✅ LIVE MODE — today's complete data
//     if (mode === 'live') {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//       query = { timestamp: { $gte: startOfDay.toISOString() } };
//       data = await this.collection
//         .find(query, { projection })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!data.length) return { metrics: {}, charts: {} };
//       const latest = data[data.length - 1];
//       return {
//         metrics: this.mapMetricsDashboard2(latest),
//         charts: this.mapChartsDashboard2(data),
//       };
//     }

//     // HISTORIC & RANGE
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
//     let metrics = this.mapMetricsDashboard2(latest);
//     if (mode === 'range')
//       metrics = {
//         ...metrics,
//         onDurationMinutes: this.calculateOnDuration(data),
//       };

//     return { metrics, charts: this.mapChartsDashboard2(data) };
//   }

//   /** -------------------
//    * Shared Helper Functions
//    * ------------------- */
//   private mapMetrics(doc: any, definitions: any) {
//     const metrics: Record<string, number> = {};
//     for (const key in definitions)
//       metrics[key] = +definitions[key](doc).toFixed(2);
//     return metrics;
//   }

//   private mapCharts(data: any[], definitions: any) {
//     const charts: Record<string, any[]> = {};

//     // Standard charts
//     for (const chartName in definitions) {
//       charts[chartName] = data.map((d) => {
//         const entry: any = { time: d.timestamp };
//         definitions[chartName].forEach((field) => (entry[field] = d[field]));
//         return entry;
//       });
//     }

//     // ⚡ Add Current Imbalance + Neutral Current chart for Dashboard 1
//     charts.CurrentImbalanceNeutral = data.map((d) => {
//       const IA = d.Genset_L1_Current || 0;
//       const IB = d.Genset_L2_Current || 0;
//       const IC = d.Genset_L3_Current || 0;

//       const avgCurrent = (IA + IB + IC) / 3 || 1;
//       const CurrentImbalance =
//         ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) * 100;
//       const neutralCurrent = Math.sqrt(
//         IA ** 2 + IB ** 2 + IC ** 2 - IA * IB - IB * IC - IC * IA,
//       );

//       return {
//         time: d.timestamp,
//         CurrentImbalance: +CurrentImbalance.toFixed(2),
//         neutralCurrent: +neutralCurrent.toFixed(2),
//       };
//     });

//     return charts;
//   }

//   /** ✅ Dashboard 2 — Only voltage & power metrics */
//   private mapMetricsDashboard2(doc: any) {
//     const metrics: Record<string, number> = {
//       voltageL1: doc.Genset_L1L2_Voltage || 0,
//       voltageL2: doc.Genset_L2L3_Voltage || 0,
//       voltageL3: doc.Genset_L3L1_Voltage || 0,
//       activePowerL1: doc.Genset_L1_Active_Power || 0,
//       activePowerL2: doc.Genset_L2_Active_Power || 0,
//       activePowerL3: doc.Genset_L3_Active_Power || 0,
//     };

//     // Current imbalance
//     const IA = doc.Genset_L1_Current || 0;
//     const IB = doc.Genset_L2_Current || 0;
//     const IC = doc.Genset_L3_Current || 0;
//     const avgCurrent = (IA + IB + IC) / 3 || 1;
//     metrics.CurrentImbalance = +(
//       ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) *
//       100
//     ).toFixed(2);

//     // Voltage imbalance
//     const VL1 = doc.Genset_L1L2_Voltage || 0;
//     const VL2 = doc.Genset_L2L3_Voltage || 0;
//     const VL3 = doc.Genset_L3L1_Voltage || 0;
//     const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
//     metrics.voltageImbalance = +(
//       ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) *
//       100
//     ).toFixed(2);

//     // Power loss factor
//     const pf = doc.Genset_Total_Power_Factor_calculated || 1;
//     metrics.powerLossFactor = +(1 / (pf * pf)).toFixed(2);

//     // Thermal stress
//     const I2 = IA ** 2 + IB ** 2 + IC ** 2;
//     const I2Rated = doc.I2Rated || 1;
//     metrics.thermalStress = +(I2 / I2Rated).toFixed(2);

//     return metrics;
//   }

//   /** ✅ Dashboard 2 — Charts with imbalance added */
//   private mapChartsDashboard2(data: any[]) {
//     const charts: Record<string, any[]> = {};

//     // ⚡ Phase Balance Effectiveness (Currents + Imbalance)
//     charts.phaseBalanceEffectiveness = data.map((d) => {
//       const IA = d.Genset_L1_Current || 0;
//       const IB = d.Genset_L2_Current || 0;
//       const IC = d.Genset_L3_Current || 0;
//       const avgCurrent = (IA + IB + IC) / 3 || 1;
//       const CurrentImbalance =
//         ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) * 100;

//       return {
//         time: d.timestamp,
//         Genset_L1_Current: IA,
//         Genset_L2_Current: IB,
//         Genset_L3_Current: IC,
//         CurrentImbalance: +CurrentImbalance.toFixed(2),
//       };
//     });

//     // ⚡ Voltage Quality & Symmetry (Voltages + Imbalance)
//     charts.voltageQualitySymmetry = data.map((d) => {
//       const VL1 = d.Genset_L1L2_Voltage || 0;
//       const VL2 = d.Genset_L2L3_Voltage || 0;
//       const VL3 = d.Genset_L3L1_Voltage || 0;
//       const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
//       const voltageImbalance =
//         ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) * 100;

//       return {
//         time: d.timestamp,
//         Genset_L1L2_Voltage: VL1,
//         Genset_L2L3_Voltage: VL2,
//         Genset_L3L1_Voltage: VL3,
//         voltageImbalance: +voltageImbalance.toFixed(2),
//       };
//     });

//     // Other existing charts unchanged
//     for (const name of Object.keys(this.DASH2_CHARTS)) {
//       if (charts[name]) continue; // skip ones we already handled
//       charts[name] = data.map((d) => {
//         const entry: any = { time: d.timestamp };
//         this.DASH2_CHARTS[name].forEach((field) => {
//           switch (field) {
//             case 'LoadPercent':
//               entry[field] = d.Genset_Application_kW_Rating_PC2X
//                 ? (d.Genset_Total_kW / d.Genset_Application_kW_Rating_PC2X) *
//                   100
//                 : 0;
//               break;
//             case 'PowerLossFactor':
//               const pf = d.Genset_Total_Power_Factor_calculated || 1;
//               entry[field] = 1 / (pf * pf);
//               break;
//             case 'I2':
//               const IA = d.Genset_L1_Current || 0;
//               const IB = d.Genset_L2_Current || 0;
//               const IC = d.Genset_L3_Current || 0;
//               entry[field] = IA ** 2 + IB ** 2 + IC ** 2;
//               break;
//             default:
//               entry[field] = d[field];
//           }
//         });
//         return entry;
//       });
//     }

//     return charts;
//   }

//   /** -------------------
//    * Shared helpers
//    * ------------------- */
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

//   /** ✅ Range now covers Genset_Run_SS 1–6 */
//   private buildQuery(mode: string, start?: string, end?: string) {
//     const query: any = {};
//     if (mode === 'historic' && start && end)
//       query.timestamp = { $gte: start, $lte: end };
//     if (mode === 'range') query.Genset_Run_SS = { $gte: 1, $lte: 6 };
//     if (start && end) query.timestamp = { $gte: start, $lte: end };
//     return query;
//   }

//   private getProjectionFieldsDashboard1() {
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

//   private getProjectionFieldsDashboard2() {
//     return {
//       ...this.getProjectionFieldsDashboard1(),
//       Genset_L1_Active_Power: 1,
//       Genset_L2_Active_Power: 1,
//       Genset_L3_Active_Power: 1,
//       I2Rated: 1,
//     };
//   }

//   /** 🧠 Main Data Fetcher */
//   async getDashboard3Data(
//     mode: 'live' | 'historic' | 'range',
//     start?: string,
//     end?: string,
//   ) {
//     const projection = this.getProjectionFieldsDashboard3();
//     let query = this.buildQuery(mode, start, end);
//     let data: any[] = [];

//     // ✅ LIVE MODE — today’s data
//     if (mode === 'live') {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//       query = { timestamp: { $gte: startOfDay.toISOString() } };

//       data = await this.collection
//         .find(query, { projection })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!data.length) return { metrics: {}, charts: {} };

//       return {
//         metrics: this.mapMetricsDashboard3(data[data.length - 1]),
//         charts: this.mapChartsDashboard3(data),
//       };
//     }

//     // ✅ HISTORIC / RANGE MODES
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
//     let metrics = this.mapMetricsDashboard3(latest);

//     // ⏱️ Include duration if range mode
//     if (mode === 'range')
//       metrics = {
//         ...metrics,
//         onDurationMinutes: this.calculateOnDuration(data),
//       };

//     return { metrics, charts: this.mapChartsDashboard3(data) };
//   }

//   /** 🧮 Metrics Mapper */
//   private mapMetricsDashboard3(doc: any): CoolingMetrics {
//     return {
//       intakeTemperature: doc.Intake_Manifold3_Temperature ?? 0,
//       boostPressure: doc.Boost_Pressure ?? 0,
//       coolingMargin: this.calculateCoolingMargin(doc),
//     };
//   }

//   /** 🌡️ Cooling Margin = Coolant - AfterCooler */
//   private calculateCoolingMargin(doc: any): number {
//     const coolant = doc.Coolant_Temperature ?? 0;
//     const afterCooler = doc.AfterCooler_Temperature ?? 0;
//     return +(coolant - afterCooler).toFixed(2);
//   }

//   /** 📈 Chart Mapper */
//   private mapChartsDashboard3(data: any[]): Record<string, any[]> {
//     const charts: Record<string, any[]> = {};

//     // Chart 1: Intake & Boost Pressure
//     charts.intakeBoost = data.map((d) => ({
//       time: d.timestamp,
//       Intake_Manifold3_Temperature: d.Intake_Manifold3_Temperature,
//       Boost_Pressure: d.Boost_Pressure,
//     }));

//     // Chart 2: Cooling Margin
//     charts.coolingMargin = data.map((d) => ({
//       time: d.timestamp,
//       Cooling_Margin: this.calculateCoolingMargin(d),
//       Coolant_Temperature: d.Coolant_Temperature ?? 0,
//       AfterCooler_Temperature: d.AfterCooler_Temperature ?? 0,
//     }));

//     return charts;
//   }

// }

/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';

interface CoolingMetrics {
  intakeTemperature: number;
  boostPressure: number;
  coolingMarginF: number;
  coolingMarginC: number;
  avg_LL_Voltage: number;
  voltageImbalance: number;
  onDurationMinutes?: number;
}

interface Dashboard5Metrics {
  fuelRate: number; // L/h
  loadPercent: number; // %
  airFuelEffectiveness: number; // Boost Pressure / Fuel Rate
  specificFuelConsumption: number; // L/kWh
  heatRate: number; // kJ/kWh
  fuelOutletPressure: number;
}

// inside dashboard.service.ts
export interface Dashboard6Metrics {
  totalFuelConsumption: number;
  energyKWh: number;
  fuelConsumptionCurrentRun: number;
  onDurationMinutes?: number;
}

interface Dashboard3Charts {
  intakeBoost?: any[];
  thermalStress?: any[];
  coolingMargin?: any[];
  voltageImbalanceChart?: any[];
  [key: string]: any[] | undefined;
}

interface Dashboard3Data {
  metrics: Record<string, any>;
  charts: Dashboard3Charts;
}

@Injectable()
export class DashboardService {
  private collection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.collection = this.db.collection('navy_historical');

    // ⚡ Indexes for fast queries
    this.collection.createIndex({ timestamp: 1 });
    this.collection.createIndex({ Genset_Run_SS: 1, timestamp: 1 });
  }

  // private formatTimeForResponse(time: Date): string {
  //   // Convert to ISO and trim to "YYYY-MM-DDTHH:MM"
  //   return new Date(time).toISOString().slice(0, 19).replace('T', ' ');
  //   // If you prefer space instead of 'T', use:
  //   // return new Date(time).toISOString().slice(0, 16).replace('T', ' ');
  // }

  private formatTimeForResponse(time: Date): string {
    const date = new Date(time);

    // Round down to start of the hour
    date.setMinutes(0, 0, 0);

    // Format "YYYY-MM-DD HH:00:00"
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /** -------------------
   * Dashboard 1 – Basic
   * ------------------- */
  private DASH1_METRICS = {
    load: (doc: any) =>
      doc.Genset_Total_kW
        ? (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) * 100
        : 0,
    rpm: (doc: any) => doc.Averagr_Engine_Speed || 0,
    runningHours: (doc: any) =>
      +(doc.Engine_Running_Time_calculated || 0).toFixed(2),
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

  /** -------------------
   * Dashboard 2 – Engineer Level
   * ------------------- */
  private DASH2_METRICS = {
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
      'Genset_LL_Avg_Voltage',
    ],
    loadVsPowerFactor: ['LoadPercent', 'Genset_Total_Power_Factor_calculated'],
    electroMechanicalStress: [
      'LoadPercent',
      'Genset_Total_Power_Factor_calculated',
    ],
    lossesThermalStress: ['PowerLossFactor', 'I2'],
    frequencyRegulationEffectiveness: [
      'Genset_Frequency_OP_calculated',
      'Frequency_Deviation_Rad',
    ],
  };

  /** -------------------
   * Dashboard 3 – Maintenance Level
   * ------------------- */
  private DASH3_CHARTS = {
    intakeBoost: ['Intake_Manifold3_Temperature', 'Boost_Pressure'],
    // thermalStress: ['Coolant_Temperature'],
  };

  async getDashboard1Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const projection = this.getProjectionFieldsDashboard1();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };
      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };
      const latest = data[data.length - 1];
      return {
        metrics: this.mapMetrics(latest, this.DASH1_METRICS),
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
    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };
    }

    return { metrics, charts: this.mapCharts(data, this.DASH1_CHARTS) };
  }

  async getDashboard2Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const projection = this.getProjectionFieldsDashboard2();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };
      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };
      const latest = data[data.length - 1];
      return {
        metrics: this.mapMetricsDashboard2(latest),
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
    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };
    }

    return { metrics, charts: this.mapChartsDashboard2(data) };
  }

  async getDashboard3Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ): Promise<Dashboard3Data> {
    const projection = this.getProjectionFieldsDashboard3();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };
      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };

      return {
        metrics: this.mapMetricsDashboard3(data[data.length - 1]),
        charts: this.mapChartsDashboard3(data),
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
    let metrics = this.mapMetricsDashboard3(latest);
    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };
    }
    return { metrics, charts: this.mapChartsDashboard3(data) };
  }

  private mapMetrics(doc: any, definitions: any) {
    const metrics: Record<string, number> = {};
    for (const key in definitions) {
      metrics[key] = +definitions[key](doc).toFixed(2);
    }
    return metrics;
  }

  private mapMetricsDashboard2(doc: any): Record<string, number> {
    const metrics: Record<string, number> = {
      voltageL1: doc.Genset_L1L2_Voltage || 0,
      voltageL2: doc.Genset_L2L3_Voltage || 0,
      voltageL3: doc.Genset_L3L1_Voltage || 0,
      activePowerL1: doc.Genset_L1_Active_Power || 0,
      activePowerL2: doc.Genset_L2_Active_Power || 0,
      activePowerL3: doc.Genset_L3_Active_Power || 0,
    };

    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const avgCurrent = (IA + IB + IC) / 3;
    metrics.CurrentImbalance = +(
      ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) *
      100
    ).toFixed(2);

    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
    metrics.voltageImbalance = +(
      ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) *
      100
    ).toFixed(2);

    const pf = doc.Genset_Total_Power_Factor_calculated || 1;
    metrics.powerLossFactor = +(1 / (pf * pf)).toFixed(2);

    const I2 = Math.sqrt((IA ** 2 + IB ** 2 + IC ** 2) / 3);
    metrics.thermalStress = +I2.toFixed(2);

    return metrics;
  }

  private mapCharts(data: any[], definitions: any) {
    const charts: Record<string, any[]> = {};

    for (const chartName in definitions) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        definitions[chartName].forEach((field: string) => {
          entry[field] = d[field];
        });
        return entry;
      });
    }

    charts.CurrentImbalanceNeutral = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;

      const avgCurrent = (IA + IB + IC) / 3 || 1;
      const CurrentImbalance =
        ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) * 100;
      const neutralCurrent = Math.sqrt(
        IA ** 2 + IB ** 2 + IC ** 2 - IA * IB - IB * IC - IC * IA,
      );

      return {
        time: d.timestamp,
        CurrentImbalance: +CurrentImbalance.toFixed(2),
        neutralCurrent: +neutralCurrent.toFixed(2),
      };
    });

    charts.loadSharing = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;

      const IAShare = (IA / (IA + IB + IC)) * 100 || 0;
      const IBShare = (IB / (IA + IB + IC)) * 100 || 0;
      const ICShare = (IC / (IA + IB + IC)) * 100 || 0;

      return {
        time: d.timestamp,
        Genset_L1_Current: IAShare,
        Genset_L2_Current: IBShare,
        Genset_L3_Current: ICShare,
      };
    });

    return charts;
  }

  private mapChartsDashboard2(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.phaseBalanceEffectiveness = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;
      const avgCurrent = (IA + IB + IC) / 3 || 1;
      const CurrentImbalance =
        ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) * 100;

      return {
        time: d.timestamp,
        Genset_L1_Current: IA,
        Genset_L2_Current: IB,
        Genset_L3_Current: IC,
        CurrentImbalance: +CurrentImbalance.toFixed(2),
      };
    });

    charts.voltageQualitySymmetry = data.map((d) => {
      const VL1 = d.Genset_L1L2_Voltage || 0;
      const VL2 = d.Genset_L2L3_Voltage || 0;
      const VL3 = d.Genset_L3L1_Voltage || 0;
      const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
      // const totalAvg = d.Genset_LL_Avg_Voltage || 0;
      const voltageImbalance =
        ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) * 100;

      return {
        time: this.formatTimeForResponse(d.timestamp),
        Genset_L1L2_Voltage: VL1,
        Genset_L2L3_Voltage: VL2,
        Genset_L3L1_Voltage: VL3,
        voltageImbalance: +voltageImbalance.toFixed(2),
        Genset_LL_Avg_Voltage: Number(vAvg.toFixed(2)),
      };
    });

    charts.electroMechanicalStress = data.map((d) => {
      const loadPercent =
        d.Genset_Application_kW_Rating_PC2X > 0
          ? (d.Genset_Total_kW / d.Genset_Application_kW_Rating_PC2X) * 100
          : 0;
      const pf = d.Genset_Total_Power_Factor_calculated || 1;

      const loadStress = (loadPercent * 1) / pf;

      return {
        time: d.timestamp,
        LoadPercent: +loadPercent.toFixed(2),
        PowerLossFactor: +pf.toFixed(2),
        LoadStress: +loadStress,
      };
    });

    for (const name of Object.keys(this.DASH2_CHARTS)) {
      if (charts[name]) continue;
      charts[name] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        this.DASH2_CHARTS[name].forEach((field: string) => {
          switch (field) {
            case 'LoadPercent':
              entry[field] = d.Genset_Total_kW
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
              entry[field] = Math.sqrt((IA ** 2 + IB ** 2 + IC ** 2) / 3);
              break;
            default:
              entry[field] = d[field];
          }
        });
        return entry;
      });
    }

    return charts;
  }

  private mapMetricsDashboard3(doc: any): CoolingMetrics {
    const avg_LL_Voltage = doc.Genset_LL_Avg_Voltage ?? 0;

    // Calculate voltage imbalance
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    const voltageImbalance =
      ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) /
        (avg_LL_Voltage || 1)) *
      100;
    return {
      intakeTemperature: doc.Intake_Manifold3_Temperature ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      avg_LL_Voltage: +avg_LL_Voltage.toFixed(2),
      voltageImbalance: +voltageImbalance.toFixed(2),
      coolingMarginF: this.calculateCoolingMarginF(doc),
      coolingMarginC: this.calculateCoolingMarginC(doc),
    };
  }

  private calculateCoolingMarginF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    // const afterCooler = doc.AfterCooler_Temperature ?? 0;
    const value = 212;
    return +(value - coolant).toFixed(2);
  }
  private calculateCoolingMarginC(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    // const afterCooler = doc.AfterCooler_Temperature ?? 0;

    return +(100 - (coolant - 32) * 0.5).toFixed(2);
  }

  private calculateThermalStressF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const min = 194; // lower bound (safe limit)
    const max = 212; // upper bound (critical limit)
    const stress = (coolant - min) / (max - min);
    return +stress.toFixed(2);
  }

  private calculateThermalStressC(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const min = 90;
    const max = 100;
    const stress = (coolant - min) / (max - min);
    return +stress.toFixed(2);
  }

  private OTSRF(doc: any): number {
    const temp = doc.Oil_Temperature ?? 0;
    const min = 200;
    const max = 257;
    const OTSRF = (max - temp) / (max - min);
    return +OTSRF.toFixed(2);
  }

  private OTSRC(doc: any): number {
    const temp = doc.Oil_Temperature ?? 0;
    const min = 93.3;
    const max = 125;
    const OTSRC = (max - temp) / (max - min);
    return +OTSRC.toFixed(2);
  }

  private mapChartsDashboard3(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    // Chart 1: Intake & Boost
    charts.intakeBoost = data.map((d) => ({
      time: d.timestamp,
      Intake_Manifold3_Temperature: d.Intake_Manifold3_Temperature,
      Boost_Pressure: d.Boost_Pressure,
    }));

    // Chart 2: thermal stress
    charts.thermalStress = data.map((d) => ({
      time: d.timestamp,
      thermalStressF: this.calculateThermalStressF(d),
      thermalStressC: this.calculateThermalStressC(d),
      OTSRF: this.OTSRF(d),
      OTSRC: this.OTSRC(d),
    }));

    charts.OilTempSafetyIndex = data.map((d) => ({
      OTSRF: this.OTSRF(d),
      OTSRC: this.OTSRC(d),
    }));

    // Chart 2: Cooling Margin
    charts.coolingMargin = data.map((d) => ({
      time: d.timestamp,
      Cooling_MarginF: this.calculateCoolingMarginF(d),
      Cooling_MarginC: this.calculateCoolingMarginC(d),
      // Coolant_Temperature: d.Coolant_Temperature ?? 0,
      // AfterCooler_Temperature: d.AfterCooler_Temperature ?? 0,
    }));

    // ✅ Chart 3: Voltage Imbalance & LL Average Voltage (direct tag)
    charts.voltageImbalanceChart = data.map((d) => {
      const VL1 = d.Genset_L1L2_Voltage || 0;
      const VL2 = d.Genset_L2L3_Voltage || 0;
      const VL3 = d.Genset_L3L1_Voltage || 0;
      const avg_LL_Voltage = d.Genset_LL_Avg_Voltage || 0;
      const voltageImbalance =
        ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) /
          (avg_LL_Voltage || 1)) *
        100;

      return {
        time: d.timestamp,
        avg_LL_Voltage: +avg_LL_Voltage.toFixed(2),
        voltageImbalance: +voltageImbalance.toFixed(2),
      };
    });

    return charts;
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
      Engine_Running_TIME_calculated: 1,
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

  private getProjectionFieldsDashboard3() {
    return {
      timestamp: 1,
      Intake_Manifold3_Temperature: 1,
      Boost_Pressure: 1,
      Coolant_Temperature: 1,
      AfterCooler_Temperature: 1,
      Genset_LL_Avg_Voltage: 1,
      // ✅ added direct tag
    };
  }

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

  private buildQuery(mode: string, start?: string, end?: string): any {
    const query: any = {};
    if (mode === 'historic' && start && end) {
      query.timestamp = { $gte: start, $lte: end };
    }
    if (mode === 'range') {
      query.Genset_Run_SS = { $gte: 1, $lte: 6 };
    }
    if (start && end) {
      query.timestamp = { $gte: start, $lte: end };
    }
    return query;
  }

  // dashboard4

  private DASH4_CHARTS = {
    lubricationRiskIndex: ['Oil_Pressure', 'Oil_Temperature'],
    oilPressureEngineSpeed: ['Oil_Pressure', 'Averagr_Engine_Speed'],
    boostFuelOutlet: ['Boost_Pressure', 'Fuel_Outlet_Pressure_calculated'],
    boostLoad: ['Boost_Pressure', 'LoadPercent'],
    fuelOutletBiometric: [
      'Fuel_Outlet_Pressure_calculated',
      'Barometric_Absolute_Pressure',
    ],
  };

  async getDashboard4Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const projection = this.getProjectionFieldsDashboard4();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };
      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };

      return {
        metrics: this.mapMetricsDashboard4(data[data.length - 1]),
        charts: this.mapChartsDashboard4(data),
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
    let metrics = this.mapMetricsDashboard4(latest);
    if (mode === 'range') {
      metrics = {
        ...(metrics as any), // tell TS it’s okay to add new props
        onDurationMinutes: this.calculateOnDuration(data),
      };
    }

    return { metrics, charts: this.mapChartsDashboard4(data) };
  }

  private mapMetricsDashboard4(doc: any) {
    const oilPressure = doc.Oil_Pressure ?? 0;
    const oilTemp = doc.Oil_Temperature ?? 0;
    const lubricationRiskIndex =
      oilTemp !== 0 ? +(oilPressure / oilTemp).toFixed(2) : 0;

    // compute Load% if you don’t have a direct LoadPercent field
    let loadPercent = 0;
    if (doc.Genset_Total_kW && doc.Genset_Total_kW) {
      loadPercent = +(
        (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) *
        100
      ).toFixed(2);
    }

    return {
      lubricationRiskIndex,
      oilPressure,
      engineSpeed: doc.Averagr_Engine_Speed ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
      biometricPressure: doc.Barometric_Absolute_Pressure ?? 0,
      loadPercent,
    };
  }

  private mapChartsDashboard4(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.lubricationRiskIndex = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure,
      Oil_Temperature: d.Oil_Temperature,
      Lubrication_Risk_Index: d.Oil_Temperature
        ? +(d.Oil_Pressure / d.Oil_Temperature).toFixed(2)
        : null,
    }));

    charts.oilPressureEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed,
    }));

    charts.boostFuelOutlet = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated,
    }));

    charts.boostLoad = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure,
      LoadPercent:
        d.Genset_Total_kW && d.Genset_Total_kW
          ? +(
              (d.Genset_Total_kW / d.Genset_Application_kW_Rating_PC2X) *
              100
            ).toFixed(2)
          : null,
    }));

    charts.fuelOutletBiometric = data.map((d) => ({
      time: d.timestamp,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated,
      Barometric_Absolute_Pressure: d.Barometric_Absolute_Pressure,
    }));

    return charts;
  }

  private getProjectionFieldsDashboard4() {
    return {
      timestamp: 1,
      Oil_Pressure: 1,
      Oil_Temperature: 1,
      Averagr_Engine_Speed: 1,
      Boost_Pressure: 1,
      Fuel_Outlet_Pressure_calculated: 1,
      Barometric_Absolute_Pressure: 1,
      Genset_Total_kW: 1,
      Genset_Application_kW_Rating_PC2X: 1,
    };
  }

  /** -------------------
   * Dashboard 5 - Fuel & Efficiency
   * ------------------- */

  async getDashboard5Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const projection = this.getProjectionFieldsDashboard5();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    // ✅ LIVE MODE — today's complete data
    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };

      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();

      if (!data.length) return { metrics: {}, charts: {} };

      return {
        metrics: this.mapMetricsDashboard5(data[data.length - 1]),
        charts: this.mapChartsDashboard5(data),
      };
    }

    // HISTORIC / RANGE
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

    let metrics = this.mapMetricsDashboard5(data[data.length - 1]);

    if (mode === 'range')
      metrics = {
        ...(metrics as any),
        onDurationMinutes: this.calculateOnDuration(data),
      };

    return { metrics, charts: this.mapChartsDashboard5(data) };
  }

  /** 🧮 Metrics Mapper */
  private mapMetricsDashboard5(doc: any): Dashboard5Metrics {
    const fuelRate = doc.Fuel_Rate ?? 0; // L/h

    let loadPercent = 0;
    if (doc.Genset_Total_kW && doc.Genset_Total_kW) {
      loadPercent = +(
        (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) *
        100
      ).toFixed(2);
    }

    const boostPressure = doc.Boost_Pressure ?? 0;

    const airFuelEffectiveness =
      fuelRate !== 0 ? +(boostPressure / fuelRate).toFixed(2) : 0;

    const powerOutput = doc.Genset_Total_kW ?? 1;

    const specificFuelConsumption =
      powerOutput !== 0 ? +((fuelRate * 3.7854) / powerOutput).toFixed(3) : 0; // L/kWh

    const heatRate = +((fuelRate * 3.7854 * 36000) / powerOutput).toFixed(2);

    return {
      fuelRate,
      loadPercent,
      airFuelEffectiveness,
      specificFuelConsumption,
      heatRate,
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
    };
  }

  /** 📈 Chart Mapper */
  private mapChartsDashboard5(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    // Chart1: Fuel Rate & Load %
    charts.fuelRateLoad = data.map((d) => {
      let loadPercent = 0;
      if (d.Genset_Total_kW && d.Genset_Total_kW) {
        loadPercent = +(
          (d.Genset_Total_kW / d.Genset_Application_kW_Rating_PC2X) *
          100
        ).toFixed(2);
      }
      return {
        time: d.timestamp,
        Fuel_Rate: d.Fuel_Rate,
        LoadPercent: loadPercent,
      };
    });

    // Chart2: Air to Fuel Effectiveness = Boost Pressure / Fuel Rate
    charts.airFuelEffectiveness = data.map((d) => {
      const fuelRate = d.Fuel_Rate ?? 0;
      const boostPressure = d.Boost_Pressure ?? 0;
      const value = fuelRate !== 0 ? +(boostPressure / fuelRate).toFixed(2) : 0;
      return { time: d.timestamp, AirFuelEffectiveness: value };
    });

    // Chart3: Specific Fuel Consumption
    charts.specificFuelConsumption = data.map((d) => {
      const fuelRate = d.Fuel_Rate ?? 0;
      const power = d.Genset_Total_kW ?? 1;
      const sfc = power !== 0 ? +((fuelRate * 3.7854) / power).toFixed(3) : 0;
      return { time: d.timestamp, SpecificFuelConsumption: sfc };
    });

    // Chart4: Heat Rate = SFC * CV
    charts.heatRate = data.map((d) => {
      const fuelRate = d.Fuel_Rate ?? 0;
      const power = d.Genset_Total_kW ?? 1;
      const CV = 36000; // kJ/L
      const heatRate =
        power > 0 ? +((fuelRate * 3.7854 * CV) / power).toFixed(3) : 0;

      return { time: d.timestamp, HeatRate: heatRate };
    });

    // Fuel Flow Rate Change
    charts.fuelFlowRateChange = data.map((d, i) => {
      const currentRate = d.Fuel_Rate ?? 0;
      const previousRate = i > 0 ? (data[i - 1].Fuel_Rate ?? 0) : currentRate;
      const change = +(currentRate - previousRate).toFixed(3);

      return { time: d.timestamp, FuelFlowRateChange: change };
    });

    // Chart5: Fuel Rate & Fuel Outlet Pressure
    charts.fuelRateOutlet = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate,
      Fuel_Outlet_Pressure: d.Fuel_Outlet_Pressure_calculated ?? 0,
    }));

    return charts;
  }

  /** ✅ Projection Fields */
  private getProjectionFieldsDashboard5() {
    return {
      timestamp: 1,
      Fuel_Rate: 1,
      Boost_Pressure: 1,
      Genset_Total_kW: 1,
      Genset_Application_kW_Rating_PC2X: 1,
      Fuel_Outlet_Pressure_calculated: 1,
    };
  }

  /** ---------------------------------------------------
   *  DASHBOARD 6 — ENGINE PERFORMANCE & TORQUE
   * --------------------------------------------------- */

  private calculateRPMStabilityIndex(data: any[]): any[] {
    const window = 10;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) continue;
      const slice = data.slice(i - window + 1, i + 1);
      const rpmValues = slice.map((d) => d.Averagr_Engine_Speed ?? 0);
      const avg = rpmValues.reduce((a, b) => a + b, 0) / rpmValues.length;
      const variance =
        rpmValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
        rpmValues.length;
      const stdDev = Math.sqrt(variance);
      const RSI = +(stdDev / (avg || 1)).toFixed(4);

      results.push({ time: data[i].timestamp, RPM_Stability_Index: RSI });
    }

    return results;
  }

  // private calculateOscillationIndex(data: any[]): any[] {
  //   const window = 10;
  //   const results: any[] = [];

  //   for (let i = 0; i < data.length; i++) {
  //     if (i < window - 1) continue;

  //     const slice = data.slice(i - window + 1, i + 1);
  //     const P = slice.map((d) => d.Genset_Total_kW ?? 0);
  //     const Q = slice.map((d) => d.Genset_Total_kVAR ?? 0);

  //     const meanP = P.reduce((a, b) => a + b, 0) / P.length;
  //     const meanQ = Q.reduce((a, b) => a + b, 0) / Q.length;

  //     const stdP = Math.sqrt(
  //       P.reduce((a, b) => a + Math.pow(b - meanP, 2), 0) / P.length,
  //     );
  //     const stdQ = Math.sqrt(
  //       Q.reduce((a, b) => a + Math.pow(b - meanQ, 2), 0) / Q.length,
  //     );

  //     const OI = +Math.sqrt(
  //       Math.pow(stdP / (meanP || 1), 2) + Math.pow(stdQ / (meanQ || 1), 2),
  //     ).toFixed(4);

  //     results.push({ time: data[i].timestamp, Oscillation_Index: OI });
  //   }

  //   return results;
  // }

  private calculateOscillationIndex(data: any[]): any[] {
    const window = 10;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) continue;

      const slice = data.slice(i - window + 1, i + 1);

      const P = slice.map((d) => d.Genset_Total_kW ?? 0);
      const S = slice.map((d) => d.Genset_Total_kVA ?? 0);

      // Calculate reactive power (Q)
      const Q = S.map((s, idx) => {
        const p = P[idx];
        return s >= p ? Math.sqrt(s * s - p * p) : 0;
      });

      const meanP = P.reduce((a, b) => a + b, 0) / P.length;
      const meanQ = Q.reduce((a, b) => a + b, 0) / Q.length;

      const stdP = Math.sqrt(
        P.reduce((a, b) => a + Math.pow(b - meanP, 2), 0) / P.length,
      );
      const stdQ = Math.sqrt(
        Q.reduce((a, b) => a + Math.pow(b - meanQ, 2), 0) / Q.length,
      );

      const OI = +Math.sqrt(
        Math.pow(stdP / (meanP || 1), 2) + Math.pow(stdQ / (meanQ || 1), 2),
      ).toFixed(4);

      results.push({ time: data[i].timestamp, Oscillation_Index: OI });
    }

    return results;
  }

  private calculateFuelConsumption(data: any[]): any[] {
    let cumulative = 0;
    const results: any[] = [];

    for (const d of data) {
      const fuelRate = d.Fuel_Rate ?? 0;
      const fuelUsed = +((fuelRate * 3) / 3600).toFixed(5); // gallons per 3-sec sample
      cumulative += fuelUsed;

      results.push({
        time: d.timestamp,
        Fuel_Used: fuelUsed,
        Fuel_Cumulative: +cumulative.toFixed(5),
      });
    }

    return results;
  }

  async getDashboard6Data(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const projection = this.getProjectionFieldsDashboard6();
    let query = this.buildQuery(mode, start, end);
    let data: any[] = [];

    if (mode === 'live') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = { timestamp: { $gte: startOfDay.toISOString() } };

      data = await this.collection
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
      if (!data.length) return { metrics: {}, charts: {} };

      return {
        metrics: this.mapMetricsDashboard6(data[data.length - 1]),
        charts: this.mapChartsDashboard6(data),
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

    let metrics = this.mapMetricsDashboard6(data[data.length - 1]);
    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDuration(data),
      };
    }

    return { metrics, charts: this.mapChartsDashboard6(data) };
  }

  /** 🧮 Metrics Mapper */
  private mapMetricsDashboard6(doc: any): Dashboard6Metrics {
    return {
      totalFuelConsumption: doc.Total_Fuel_Consumption_calculated ?? 0,
      energyKWh: doc.Engine_Running_Time_calculated ?? 0,
      // energyKWh: (doc.Fuel_Rate * 3.7854 * 0.85 * 43000) / 3600 || 0,
      fuelConsumptionCurrentRun: doc.Total_Fuel_Consumption_calculated ?? 0,
    };
  }

  /** 📈 Charts Mapper */
  private mapChartsDashboard6(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    // Chart 1: Percent Engine Torque or Duty Cycle vs Engine Running Time
    charts.engineTorqueVsRunningTime = data.map((d) => ({
      time: d.timestamp,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
      Engine_Running_Time_calculated: d.Engine_Running_Time_calculated ?? 0,
    }));

    // Chart 2: Fuel Rate vs Percent Engine Torque
    charts.fuelRateVsTorque = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
    }));

    // Chart 3: Average Engine Speed
    charts.averageEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? 0,
    }));

    charts.mechanicalStress = data.map((d) => {
      const avg = d.Averagr_Engine_Speed ?? 0;
      const stress = +((avg - 1500) / 1500).toFixed(3); // deviation ratio
      return { time: d.timestamp, Mechanical_Stress: stress };
    });

    charts.rpmStabilityIndex = this.calculateRPMStabilityIndex(data);

    // Chart 4: Genset Total Power Factor
    charts.gensetPowerFactor = data.map((d) => ({
      time: d.timestamp,
      Genset_Total_kW: d.Genset_Total_kW ?? 0,
    }));

    charts.oscillationIndex = this.calculateOscillationIndex(data);
    charts.fuelConsumption = this.calculateFuelConsumption(data);

    return charts;
  }

  /** ✅ Projection Fields */
  private getProjectionFieldsDashboard6() {
    return {
      timestamp: 1,
      Total_Fuel_Consumption_calculated: 1,
      'Energy [kWh]': 1,
      Fuel_Consumption_Current_Run: 1,
      Percent_Engine_Torque_or_Duty_Cycle: 1,
      Engine_Running_Time_calculated: 1,
      Fuel_Rate: 1,
      Averagr_Engine_Speed: 1,
      Genset_Total_Power_Factor_calculated: 1,
    };
  }
}
