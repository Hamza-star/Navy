/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// import { Inject, Injectable } from '@nestjs/common';
// import { Db } from 'mongodb';

// @Injectable()
// export class TrendsService {
//   private collection;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.collection = this.db.collection('navy_historical');
//     this.collection.createIndex({ timestamp: 1 });
//     this.collection.createIndex({ Genset_Run_SS: 1, timestamp: 1 });
//   }

//   async getTrends(payload: any) {
//     const {
//       mode,
//       startDate,
//       endDate,
//       limit = 500,
//       skip = 0,
//       sortOrder = 'asc',
//       params = [],
//     } = payload;

//     let query: any = {};

//     // --- Mode Logic ---
//     if (mode === 'historical') {
//       if (!startDate || !endDate) {
//         throw new Error(
//           'startDate and endDate are required for historical mode',
//         );
//       }
//       query = {
//         timestamp: { $gte: startDate, $lte: endDate },
//       };
//     } else if (mode === 'range') {
//       query = { Genset_Run_SS: { $gte: 1, $lte: 6 } };
//     } else {
//       throw new Error('Invalid mode. Use "historical" or "range".');
//     }

//     // --- Default Projection (all genset params) ---
//     const allParams = [
//       'Genset_L1_kW',
//       'Genset_L2_kW',
//       'Genset_L3_kW',
//       'Genset_Total_kW',
//       'Genset_L1_kVA',
//       'Genset_L2_kVA',
//       'Genset_L3_kVA',
//       'Genset_Total_kVA',
//       'Genset_L1_Current',
//       'Genset_L2_Current',
//       'Genset_L3_Current',
//       'Genset_Avg_Current',
//       'Genset_L1L2_Voltage',
//       'Genset_L2L3_Voltage',
//       'Genset_L3L1_Voltage',
//       'Genset_L1N_Voltage',
//       'Genset_L2N_Voltage',
//       'Genset_L3N_Voltage',
//       'Genset_LL_Avg_Voltage',
//       'Genset_LN_Avg_Voltage',
//       'Genset_L1_Power_Factor_PC2X',
//       'Genset_L2_Power_Factor_PC2X',
//       'Genset_L3_Power_Factor_PC2X',
//       'Genset_Total_Power_Factor_calculated',
//       'Total_Fuel_Consumption_calculated',
//       'Averagr_Engine_Speed',
//       'Percent_Engine_Torque_or_Duty_Cycle',
//       'Fuel_Rate',
//       'Oil_Pressure',
//       'Boost_Pressure',
//       'Oil_Temperature',
//       'Coolant_Temperature',
//       'Intake_Manifold_Temperature_calculated',
//       'Nominal_Battery_Voltage',
//       'Battery_Voltage_calculated',
//     ];

//     // --- Build projection dynamically ---
//     const projection: any = { _id: 0, timestamp: 1 };
//     const selected = params.length > 0 ? params : allParams;
//     selected.forEach((p: string) => (projection[p] = 1));

//     // --- Fetch Data ---
//     const data = await this.collection
//       .find(query, { projection })
//       .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     // --- Group Definitions (for frontend dropdowns) ---
//     const groups = {
//       Power: [
//         'Genset_L1_kW',
//         'Genset_L2_kW',
//         'Genset_L3_kW',
//         'Genset_Total_kW',
//         'Genset_L1_kVA',
//         'Genset_L2_kVA',
//         'Genset_L3_kVA',
//         'Genset_Total_kVA',
//       ],
//       Current: [
//         'Genset_L1_Current',
//         'Genset_L2_Current',
//         'Genset_L3_Current',
//         'Genset_Avg_Current',
//       ],
//       Voltage: [
//         'Genset_L1L2_Voltage',
//         'Genset_L2L3_Voltage',
//         'Genset_L3L1_Voltage',
//         'Genset_L1N_Voltage',
//         'Genset_L2N_Voltage',
//         'Genset_L3N_Voltage',
//         'Genset_LL_Avg_Voltage',
//         'Genset_LN_Avg_Voltage',
//       ],
//       'Power Factor': [
//         'Genset_L1_Power_Factor_PC2X',
//         'Genset_L2_Power_Factor_PC2X',
//         'Genset_L3_Power_Factor_PC2X',
//         'Genset_Total_Power_Factor_calculated',
//       ],
//       'Fuel & Engine': [
//         'Total_Fuel_Consumption_calculated',
//         'Averagr_Engine_Speed',
//         'Percent_Engine_Torque_or_Duty_Cycle',
//         'Fuel_Rate',
//       ],
//       'Temperature & Pressure': [
//         'Oil_Pressure',
//         'Boost_Pressure',
//         'Oil_Temperature',
//         'Coolant_Temperature',
//         'Intake_Manifold_Temperature_calculated',
//       ],
//       Battery: ['Nominal_Battery_Voltage', 'Battery_Voltage_calculated'],
//     };

//     return {
//       count: data.length,
//       selectedParams: selected,
//       pagination: { limit, skip, sortOrder },
//       data,
//       groups,
//     };
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from './formulas.service';
import { params } from 'utils/param-groups';

@Injectable()
export class TrendsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_historical');
    this.collection.createIndex({ timestamp: 1 });
  }

  /** ✅ /getlist endpoint — return all params for dropdown */
  async getList() {
    return params;
  }

  /** ✅ Fetch trend data for selected params */
  async getTrends({ startDate, endDate, selectedParams }: any) {
    const query: any = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const projection = selectedParams.reduce(
      (acc, key) => ({ ...acc, [key]: 1 }),
      { timestamp: 1 },
    );

    const docs = await this.collection
      .find(query, { projection })
      .sort({ timestamp: 1 })
      .toArray();

    // 🧮 Handle formulas (calculated params)
    const response = docs.map((doc) => {
      const result: any = { timestamp: doc.timestamp };

      for (const param of selectedParams) {
        if (params.includes(param)) {
          switch (param) {
            case 'Load_Percent':
              result[param] = this.formulasService.calculateLoadPercent(doc);
              break;
            case 'Running_Hours':
              result[param] = this.formulasService.calculateRunningHours(doc);
              break;
            case 'Current_Imbalance':
              result[param] =
                this.formulasService.calculateCurrentImbalance(doc);
              break;
            case 'Voltage_Imbalance':
              result[param] =
                this.formulasService.calculateVoltageImbalance(doc);
              break;
            case 'Power_Loss_Factor':
              result[param] =
                this.formulasService.calculatePowerLossFactor(doc);
              break;
            case 'Thermal_Stress':
              result[param] = this.formulasService.calculateThermalStress(doc);
              break;
            case 'Neutral_Current':
              result[param] = this.formulasService.calculateNeutralCurrent(doc);
              break;
            case 'Load_Stress':
              result[param] = this.formulasService.calculateLoadStress(doc);
              break;
            case 'Cooling_Margin_F':
              result[param] = this.formulasService.calculateCoolingMarginF(doc);
              break;
            case 'Cooling_Margin_C':
              result[param] = this.formulasService.calculateCoolingMarginC(doc);
              break;
            case 'Thermal_Stress_F':
              result[param] = this.formulasService.calculateThermalStressF(doc);
              break;
            case 'Thermal_Stress_C':
              result[param] = this.formulasService.calculateThermalStressC(doc);
              break;
            case 'OTSR_F':
              result[param] = this.formulasService.calculateOTSRF(doc);
              break;
            case 'OTSR_C':
              result[param] = this.formulasService.calculateOTSRC(doc);
              break;
            case 'Lubrication_Risk_Index':
              result[param] =
                this.formulasService.calculateLubricationRiskIndex(doc);
              break;
            case 'Air_Fuel_Effectiveness':
              result[param] =
                this.formulasService.calculateAirFuelEffectiveness(doc);
              break;
            case 'Specific_Fuel_Consumption':
              result[param] =
                this.formulasService.calculateSpecificFuelConsumption(doc);
              break;
            case 'Heat_Rate':
              result[param] = this.formulasService.calculateHeatRate(doc);
              break;
            case 'Fuel_Flow_Change':
              result[param] = this.formulasService.calculateFuelFlowRateChange(
                doc,
                doc,
              );
              break;
            case 'Mechanical_Stress':
              result[param] =
                this.formulasService.calculateMechanicalStress(doc);
              break;
            default:
              result[param] = doc[param] ?? null;
          }
        }
      }

      return result;
    });

    return response;
  }
}
