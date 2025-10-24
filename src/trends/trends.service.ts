/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

  // 🔹 return all parameters (for dropdown)
  async getList() {
    return params;
  }

  private formatTimestamp(value: any): string {
    if (!value) return '';

    const date = new Date(value); // use raw Mongo timestamp

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // async getTrends(payload: any) {
  //   const {
  //     mode,
  //     startDate,
  //     endDate,
  //     params: selectedParams = [],
  //     sortOrder = 'asc',
  //   } = payload;

  //   if (!mode) throw new Error('Mode is required');

  //   let query: any = {};

  //   if (mode === 'historic') {
  //     if (!startDate || !endDate)
  //       throw new Error('startDate and endDate are required');

  //     const sampleDoc = await this.collection.findOne(
  //       {},
  //       { projection: { timestamp: 1 } },
  //     );
  //     const isTimestampString =
  //       sampleDoc && typeof sampleDoc.timestamp === 'string';

  //     if (isTimestampString) {
  //       query.timestamp = { $gte: startDate, $lte: endDate };
  //     } else {
  //       query.timestamp = {
  //         $gte: new Date(startDate),
  //         $lte: new Date(endDate),
  //       };
  //     }
  //   } else if (mode === 'range') {
  //     query.Genset_Run_SS = { $gte: 1, $lte: 6 };
  //   } else {
  //     throw new Error('Invalid mode');
  //   }

  //   // ✅ Step 0: Dependency map (derived → raw)
  //   const dependencyMap: Record<string, string[]> = {
  //     Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
  //     Voltage_Imbalance: [
  //       'Genset_L1L2_Voltage',
  //       'Genset_L2L3_Voltage',
  //       'Genset_L3L1_Voltage',
  //     ],
  //     Current_Imbalance: [
  //       'Genset_L1_Current',
  //       'Genset_L2_Current',
  //       'Genset_L3_Current',
  //     ],
  //     Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
  //     Thermal_Stress: [
  //       'Genset_L1_Current',
  //       'Genset_L2_Current',
  //       'Genset_L3_Current',
  //       'Genset_Application_kW_Rating_PC2X',
  //     ],
  //     RPM_Stability_Index: ['Averagr_Engine_Speed'],
  //     Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
  //     Fuel_Consumption: [
  //       'Fuel_Rate',
  //       'Genset_Total_kW',
  //       'Genset_Application_kW_Rating_PC2X',
  //     ],
  //     Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
  //     Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
  //     Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
  //     Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
  //     Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
  //   };

  //   // ✅ Step 1: Build projection with dependencies
  //   const projectionKeys = new Set<string>(['timestamp']);
  //   for (const param of selectedParams) {
  //     projectionKeys.add(param);
  //     const deps = dependencyMap[param];
  //     if (deps) deps.forEach((d) => projectionKeys.add(d));
  //   }

  //   const projection = Array.from(projectionKeys).reduce(
  //     (acc, key) => ({ ...acc, [key]: 1 }),
  //     {},
  //   );

  //   // ✅ Step 2: Fetch *ALL* matching data (pagination removed)
  //   const docs = await this.collection
  //     .find(query, { projection })
  //     .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
  //     .toArray(); // 👈 no skip/limit

  //   if (!docs.length) return [];

  //   const data = docs.map((doc) => ({
  //     ...doc,
  //     timestamp: this.formatTimestamp(doc.timestamp),
  //   }));

  //   // ✅ Step 3: Prepare result containers
  //   const results: any = {};

  //   // --- Multi-point calculations ---
  //   if (selectedParams.includes('RPM_Stability_Index')) {
  //     results.rpm = this.formulasService.calculateRPMStabilityWithLoad(data);
  //   }

  //   if (selectedParams.includes('Oscillation_Index')) {
  //     results.osc = this.formulasService.calculateOscillationIndex(data);
  //   }

  //   if (selectedParams.includes('Fuel_Consumption')) {
  //     results.fuel = this.formulasService.calculateFuelConsumption(data);
  //   }

  //   // ✅ Step 4: Single-point calculations
  //   const singlePointData = data.map((doc) => {
  //     const record: any = { timestamp: doc.timestamp };

  //     for (const param of selectedParams) {
  //       if (
  //         [
  //           'RPM_Stability_Index',
  //           'Oscillation_Index',
  //           'Fuel_Consumption',
  //         ].includes(param)
  //       )
  //         continue;

  //       let value: any;
  //       switch (param) {
  //         case 'Load_Percent':
  //           value = this.formulasService.calculateLoadPercent(doc);
  //           break;
  //         case 'Running_Hours':
  //           value = this.formulasService.calculateRunningHours(doc);
  //           break;
  //         case 'Current_Imbalance':
  //           value = this.formulasService.calculateCurrentImbalance(doc);
  //           break;
  //         case 'Voltage_Imbalance':
  //           value = this.formulasService.calculateVoltageImbalance(doc);
  //           break;
  //         case 'Power_Loss_Factor':
  //           value = this.formulasService.calculatePowerLossFactor(doc);
  //           break;
  //         case 'Thermal_Stress':
  //           value = this.formulasService.calculateThermalStress(doc);
  //           break;
  //         case 'Neutral_Current':
  //           value = this.formulasService.calculateNeutralCurrent(doc);
  //           break;
  //         case 'Load_Stress':
  //           value = this.formulasService.calculateLoadStress(doc);
  //           break;
  //         case 'Lubrication_Risk_Index':
  //           value = this.formulasService.calculateLubricationRiskIndex(doc);
  //           break;
  //         case 'Air_Fuel_Effectiveness':
  //           value = this.formulasService.calculateAirFuelEffectiveness(doc);
  //           break;
  //         case 'Specific_Fuel_Consumption':
  //           value = this.formulasService.calculateSpecificFuelConsumption(doc);
  //           break;
  //         case 'Heat_Rate':
  //           value = this.formulasService.calculateHeatRate(doc);
  //           break;
  //         case 'Mechanical_Stress':
  //           value = this.formulasService.calculateMechanicalStress(doc);
  //           break;
  //         default:
  //           value = doc[param] ?? null;
  //       }

  //       record[param] = value;
  //     }

  //     return record;
  //   });

  //   // ✅ Step 5: Merge batch results
  //   const merged: any[] = [];

  //   for (let i = 0; i < singlePointData.length; i++) {
  //     const mergedRecord = { ...singlePointData[i] };

  //     if (results.rpm) {
  //       const rpmMatch = results.rpm.find(
  //         (r) => r.time === mergedRecord.timestamp,
  //       );
  //       if (rpmMatch)
  //         Object.assign(mergedRecord, {
  //           RPM_Stability_Index: rpmMatch.RPM_Stability_Index,
  //           Load_Percent: rpmMatch.Load_Percent ?? mergedRecord.Load_Percent,
  //         });
  //     }

  //     if (results.osc) {
  //       const oscMatch = results.osc.find(
  //         (o) => o.time === mergedRecord.timestamp,
  //       );
  //       if (oscMatch)
  //         Object.assign(mergedRecord, {
  //           Oscillation_Index: oscMatch.Oscillation_Index,
  //           Load_Percent: oscMatch.Load_Percent ?? mergedRecord.Load_Percent,
  //         });
  //     }

  //     if (results.fuel) {
  //       const fuelMatch = results.fuel.find(
  //         (f) => f.time === mergedRecord.timestamp,
  //       );
  //       if (fuelMatch)
  //         Object.assign(mergedRecord, {
  //           Fuel_Used: fuelMatch.Fuel_Used,
  //           Fuel_Cumulative: fuelMatch.Fuel_Cumulative,
  //           Load_Percent: fuelMatch.Load_Percent ?? mergedRecord.Load_Percent,
  //         });
  //     }

  //     merged.push(mergedRecord);
  //   }

  //   return merged;
  // }

  async getTrends(payload: any) {
    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      sortOrder = 'asc',
    } = payload;

    if (!mode) throw new Error('Mode is required');

    let query: any = {};

    if (mode === 'historic') {
      if (!startDate || !endDate)
        throw new Error('startDate and endDate are required');

      const sampleDoc = await this.collection.findOne(
        {},
        { projection: { timestamp: 1 } },
      );
      const isTimestampString =
        sampleDoc && typeof sampleDoc.timestamp === 'string';

      if (isTimestampString) {
        query.timestamp = { $gte: startDate, $lte: endDate };
      } else {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
    } else if (mode === 'range') {
      query.Genset_Run_SS = { $gte: 1, $lte: 6 };
    } else {
      throw new Error('Invalid mode');
    }

    // ✅ Dependency Map (for calculated parameters)
    const dependencyMap: Record<string, string[]> = {
      Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
      Voltage_Imbalance: [
        'Genset_L1L2_Voltage',
        'Genset_L2L3_Voltage',
        'Genset_L3L1_Voltage',
      ],
      Current_Imbalance: [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
      Thermal_Stress: [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Genset_Application_kW_Rating_PC2X',
      ],
      RPM_Stability_Index: ['Averagr_Engine_Speed'],
      Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
      Fuel_Consumption: [
        'Fuel_Rate',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
      ],
      Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
      Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
      Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
      Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
      Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
    };

    // ✅ Step 1: Build projection
    const projectionKeys = new Set<string>(['timestamp']);
    for (const param of selectedParams) {
      projectionKeys.add(param);
      const deps = dependencyMap[param];
      if (deps) deps.forEach((d) => projectionKeys.add(d));
    }

    const projection = Array.from(projectionKeys).reduce(
      (acc, key) => ({ ...acc, [key]: 1 }),
      {},
    );

    // ✅ Step 2: Cursor-based streaming (no skip/limit)
    const cursor = this.collection
      .find(query, { projection })
      .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
      .batchSize(1000); // 1000 docs per read batch

    const data: any[] = [];
    for await (const doc of cursor) {
      data.push({
        ...doc,
        timestamp: this.formatTimestamp(doc.timestamp),
      });
    }

    if (!data.length) return [];

    // ✅ Step 3: Multi-point calculations
    const results: any = {};

    if (selectedParams.includes('RPM_Stability_Index')) {
      results.rpm = this.formulasService.calculateRPMStabilityWithLoad(data);
    }

    if (selectedParams.includes('Oscillation_Index')) {
      results.osc = this.formulasService.calculateOscillationIndex(data);
    }

    if (selectedParams.includes('Fuel_Consumption')) {
      results.fuel = this.formulasService.calculateFuelConsumption(data);
    }

    // ✅ Step 4: Single-point calculations
    const singlePointData = data.map((doc) => {
      const record: any = { timestamp: doc.timestamp };

      for (const param of selectedParams) {
        if (
          [
            'RPM_Stability_Index',
            'Oscillation_Index',
            'Fuel_Consumption',
          ].includes(param)
        )
          continue;

        let value: any;
        switch (param) {
          case 'Load_Percent':
            value = this.formulasService.calculateLoadPercent(doc);
            break;
          case 'Running_Hours':
            value = this.formulasService.calculateRunningHours(doc);
            break;
          case 'Current_Imbalance':
            value = this.formulasService.calculateCurrentImbalance(doc);
            break;
          case 'Voltage_Imbalance':
            value = this.formulasService.calculateVoltageImbalance(doc);
            break;
          case 'Power_Loss_Factor':
            value = this.formulasService.calculatePowerLossFactor(doc);
            break;
          case 'Thermal_Stress':
            value = this.formulasService.calculateThermalStress(doc);
            break;
          case 'Neutral_Current':
            value = this.formulasService.calculateNeutralCurrent(doc);
            break;
          case 'Load_Stress':
            value = this.formulasService.calculateLoadStress(doc);
            break;
          case 'Lubrication_Risk_Index':
            value = this.formulasService.calculateLubricationRiskIndex(doc);
            break;
          case 'Air_Fuel_Effectiveness':
            value = this.formulasService.calculateAirFuelEffectiveness(doc);
            break;
          case 'Specific_Fuel_Consumption':
            value = this.formulasService.calculateSpecificFuelConsumption(doc);
            break;
          case 'Heat_Rate':
            value = this.formulasService.calculateHeatRate(doc);
            break;
          case 'Mechanical_Stress':
            value = this.formulasService.calculateMechanicalStress(doc);
            break;
          default:
            value = doc[param] ?? null;
        }

        record[param] = value;
      }

      return record;
    });

    // ✅ Step 5: Merge multi-point and single-point results
    const merged: any[] = [];

    for (let i = 0; i < singlePointData.length; i++) {
      const mergedRecord = { ...singlePointData[i] };

      if (results.rpm) {
        const rpmMatch = results.rpm.find(
          (r) => r.time === mergedRecord.timestamp,
        );
        if (rpmMatch)
          Object.assign(mergedRecord, {
            RPM_Stability_Index: rpmMatch.RPM_Stability_Index,
            Load_Percent: rpmMatch.Load_Percent ?? mergedRecord.Load_Percent,
          });
      }

      if (results.osc) {
        const oscMatch = results.osc.find(
          (o) => o.time === mergedRecord.timestamp,
        );
        if (oscMatch)
          Object.assign(mergedRecord, {
            Oscillation_Index: oscMatch.Oscillation_Index,
            Load_Percent: oscMatch.Load_Percent ?? mergedRecord.Load_Percent,
          });
      }

      if (results.fuel) {
        const fuelMatch = results.fuel.find(
          (f) => f.time === mergedRecord.timestamp,
        );
        if (fuelMatch)
          Object.assign(mergedRecord, {
            Fuel_Used: fuelMatch.Fuel_Used,
            Fuel_Cumulative: fuelMatch.Fuel_Cumulative,
            Load_Percent: fuelMatch.Load_Percent ?? mergedRecord.Load_Percent,
          });
      }

      merged.push(mergedRecord);
    }

    return merged;
  }
}
