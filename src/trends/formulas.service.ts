/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';

@Injectable()
export class FormulasService {
  /** -------------------
   * Utility Functions
   * ------------------- */

  formatTimeForResponse(time: Date): string {
    const date = new Date(time);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  calculateOnDuration(data: any[]): number {
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

  /** -------------------
   * Dashboard 1 Formulas
   * ------------------- */

  calculateLoad(doc: any): number {
    return doc.Genset_Application_kW_Rating_PC2X
      ? (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) * 100
      : 0;
  }

  calculateRunningHours(doc: any): number {
    return +(doc.Engine_Running_Time_calculated || 0).toFixed(2);
  }

  /** -------------------
   * Dashboard 2 Formulas
   * ------------------- */

  calculateCurrentImbalance(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const avgCurrent = (IA + IB + IC) / 3 || 1;
    return +(
      ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) *
      100
    ).toFixed(2);
  }

  calculateVoltageImbalance(doc: any): number {
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
    return +(
      ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) *
      100
    ).toFixed(2);
  }

  calculatePowerLossFactor(doc: any): number {
    const pf = doc.Genset_Total_Power_Factor_calculated || 1;
    return +(1 / (pf * pf)).toFixed(2);
  }

  calculateThermalStress(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const I2 = Math.sqrt((IA ** 2 + IB ** 2 + IC ** 2) / 3);
    return +I2.toFixed(2);
  }

  calculateNeutralCurrent(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    return +Math.sqrt(
      IA ** 2 + IB ** 2 + IC ** 2 - IA * IB - IB * IC - IC * IA,
    ).toFixed(2);
  }

  calculateLoadPercent(doc: any): number {
    if (!doc.Genset_Total_kW || !doc.Genset_Application_kW_Rating_PC2X) {
      return 0;
    }
    return +(
      (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) *
      100
    ).toFixed(2);
  }

  calculateLoadStress(doc: any): number {
    const loadPercent = this.calculateLoadPercent(doc);
    const pf = doc.Genset_Total_Power_Factor_calculated || 1;
    return +(loadPercent * 1) / pf;
  }

  /** -------------------
   * Dashboard 3 Formulas
   * ------------------- */

  calculateCoolingMarginF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const value = 212;
    return +(value - coolant).toFixed(2);
  }

  calculateCoolingMarginC(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    return +(100 - (coolant - 32) * 0.5).toFixed(2);
  }

  calculateThermalStressF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const min = 194;
    const max = 212;
    const stress = (coolant - min) / (max - min);
    return +stress.toFixed(2);
  }

  calculateThermalStressC(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const min = 90;
    const max = 100;
    const stress = (coolant - min) / (max - min);
    return +stress.toFixed(2);
  }

  calculateOTSRF(doc: any): number {
    const temp = doc.Oil_Temperature ?? 0;
    const min = 200;
    const max = 257;
    const OTSRF = (max - temp) / (max - min);
    return +OTSRF.toFixed(2);
  }

  calculateOTSRC(doc: any): number {
    const temp = doc.Oil_Temperature ?? 0;
    const min = 93.3;
    const max = 125;
    const OTSRC = (max - temp) / (max - min);
    return +OTSRC.toFixed(2);
  }

  calculateAvgLLVoltage(doc: any): number {
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    return +((VL1 + VL2 + VL3) / 3).toFixed(2);
  }

  /** -------------------
   * Dashboard 4 Formulas
   * ------------------- */

  calculateLubricationRiskIndex(doc: any): number {
    const oilPressure = doc.Oil_Pressure ?? 0;
    const oilTemp = doc.Oil_Temperature ?? 0;
    return oilTemp !== 0 ? +(oilPressure / oilTemp).toFixed(2) : 0;
  }

  /** -------------------
   * Dashboard 5 Formulas
   * ------------------- */

  calculateAirFuelEffectiveness(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const boostPressure = doc.Boost_Pressure ?? 0;
    return fuelRate !== 0 ? +(boostPressure / fuelRate).toFixed(2) : 0;
  }

  calculateSpecificFuelConsumption(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const powerOutput = doc.Genset_Total_kW ?? 1;
    return powerOutput !== 0
      ? +((fuelRate * 3.7854) / powerOutput).toFixed(3)
      : 0;
  }

  calculateHeatRate(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const powerOutput = doc.Genset_Total_kW ?? 1;
    const CV = 36000;
    return powerOutput > 0
      ? +((fuelRate * 3.7854 * CV) / powerOutput).toFixed(3)
      : 0;
  }

  calculateFuelFlowRateChange(current: any, previous: any): number {
    const currentRate = current.Fuel_Rate ?? 0;
    const previousRate = previous?.Fuel_Rate ?? currentRate;
    return +(currentRate - previousRate).toFixed(3);
  }

  /** -------------------
   * Dashboard 6 Formulas
   * ------------------- */

  calculateRPMStabilityWithLoad(data: any[]): any[] {
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

      const currentLoadPercent = this.calculateLoadPercent(data[i]);

      results.push({
        time: data[i].timestamp,
        RPM_Stability_Index: RSI,
        Load_Percent: currentLoadPercent,
      });
    }

    return results;
  }

  calculateOscillationIndex(data: any[]): any[] {
    const window = 10;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) continue;

      const slice = data.slice(i - window + 1, i + 1);

      const P = slice.map((d) => d.Genset_Total_kW ?? 0);
      const S = slice.map((d) => d.Genset_Total_kVA ?? 0);

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

      const currentLoadPercent = this.calculateLoadPercent(data[i]);

      results.push({
        time: data[i].timestamp,
        Oscillation_Index: OI,
        Load_Percent: currentLoadPercent,
      });
    }

    return results;
  }

  calculateFuelConsumption(data: any[]): any[] {
    let cumulative = 0;
    const results: any[] = [];

    for (const d of data) {
      const fuelRate = d.Fuel_Rate ?? 0;
      const fuelUsed = +((fuelRate * 3) / 3600).toFixed(5);
      cumulative += fuelUsed;

      const currentLoadPercent = this.calculateLoadPercent(d);

      results.push({
        time: d.timestamp,
        Fuel_Used: fuelUsed,
        Fuel_Cumulative: +cumulative.toFixed(5),
        Load_Percent: currentLoadPercent,
      });
    }

    return results;
  }

  calculateMechanicalStress(doc: any): number {
    const avg = doc.Averagr_Engine_Speed ?? 0;
    return +((avg - 1500) / 1500).toFixed(3);
  }
}
