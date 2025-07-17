export class TowerDataProcessor {
  static calculateAverage(values: number[]): number {
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }

  static calculateRange(data: any[], tower: '4101' | '3851' | 'all' = 'all') {
    const ranges = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    } as Record<string, number[]>;

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        ranges['4101_E01'].push(
          (item.r_Cooling_Water_Supply_Header_4101_TI_44_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0),
        );

        ranges['4101_E02'].push(
          (item.r_Cooling_Water_Supply_Header_4101_TI_54_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_4101_TI_51_Scaled || 0),
        );
      }

      if (tower === '3851' || tower === 'all') {
        ranges['3851_E03'].push(
          (item.r_Cooling_Water_Supply_Header_4101_TI_71_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_3851_TI_44_Scaled || 0),
        );

        ranges['3851_E04'].push(
          (item.Cooling_Water_Supply_Header_4101_TI_81_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0),
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in ranges) {
      const avg = this.calculateAverage(ranges[key]);
      averages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      rangeAverages: averages,
      rangeTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }

  static calculateApproach(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const wetBulbTemp = 25;
    const approaches = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    } as Record<string, number[]>;

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        approaches['4101_E01'].push(
          (item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0) -
            wetBulbTemp,
        );
        approaches['4101_E02'].push(
          (item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0) -
            wetBulbTemp,
        );
      }

      if (tower === '3851' || tower === 'all') {
        approaches['3851_E03'].push(
          (item.r_Cooling_Water_Supply_Header_3851_TI_44_Scaled || 0) -
            wetBulbTemp,
        );
        approaches['3851_E04'].push(
          (item.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0) -
            wetBulbTemp,
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in approaches) {
      const avg = this.calculateAverage(approaches[key]);
      averages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      approachAverages: averages,
      approachTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }

  static calculateEfficiency(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const wetBulbTemp = 25;
    const efficiencies = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    } as Record<string, number[]>;

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        const hot1 = item.r_Cooling_Water_Supply_Header_4101_TI_44_Scaled || 0;
        const cold1 = item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0;
        const hot2 = item.r_Cooling_Water_Supply_Header_4101_TI_54_Scaled || 0;
        const cold2 = item.r_Cooling_Water_Supply_Header_4101_TI_51_Scaled || 0;

        efficiencies['4101_E01'].push(
          ((hot1 - cold1) / (hot1 - wetBulbTemp)) * 100 || 0,
        );
        efficiencies['4101_E02'].push(
          ((hot2 - cold2) / (hot2 - wetBulbTemp)) * 100 || 0,
        );
      }

      if (tower === '3851' || tower === 'all') {
        const hot3 = item.r_Cooling_Water_Supply_Header_4101_TI_71_Scaled || 0;
        const cold3 = item.r_Cooling_Water_Supply_Header_3851_TI_44_Scaled || 0;
        const hot4 = item.Cooling_Water_Supply_Header_4101_TI_81_Scaled || 0;
        const cold4 = item.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0;

        efficiencies['3851_E03'].push(
          ((hot3 - cold3) / (hot3 - wetBulbTemp)) * 100 || 0,
        );
        efficiencies['3851_E04'].push(
          ((hot4 - cold4) / (hot4 - wetBulbTemp)) * 100 || 0,
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in efficiencies) {
      const avg = this.calculateAverage(efficiencies[key]);
      averages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      efficiencyAverages: averages,
      efficiencyTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }

  static calculateAvgWaterConsumption(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const flowrates = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    } as Record<string, number[]>;

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        flowrates['4101_E01'].push(item.U3_FM3_Flowrate || 0);
        flowrates['4101_E02'].push(item.U4_FM4_Flowrate || 0);
      }
      if (tower === '3851' || tower === 'all') {
        flowrates['3851_E03'].push(item.U1_FM1_Flowrate || 0);
        flowrates['3851_E04'].push(item.U2_FM2_Flowrate || 0);
      }
    }

    const averages: Record<string, number> = {};
    const dailyConsumption: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in flowrates) {
      const avgFlow = this.calculateAverage(flowrates[key]); // m³/h
      const daily = avgFlow * 24; // m³/day
      averages[key] = avgFlow;
      dailyConsumption[key] = daily;

      if (key.startsWith('4101')) total4101 += daily;
      if (key.startsWith('3851')) total3851 += daily;
    }

    return {
      avgFlowratePerUnit: averages,
      dailyConsumptionBreakdown: dailyConsumption,
      dailyConsumptionTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }

  static calculateCoolingCapacity(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const capacities = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    } as Record<string, number[]>;

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        const flow1 = item.U3_FM3_Flowrate || 0;
        const flow2 = item.U4_FM4_Flowrate || 0;
        const hot1 = item.r_Cooling_Water_Supply_Header_4101_TI_44_Scaled || 0;
        const cold1 = item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0;
        const hot2 = item.r_Cooling_Water_Supply_Header_4101_TI_54_Scaled || 0;
        const cold2 = item.r_Cooling_Water_Supply_Header_4101_TI_51_Scaled || 0;

        capacities['4101_E01'].push(
          (flow1 * 1000 * 4.184 * (hot1 - cold1)) / 3600,
        );
        capacities['4101_E02'].push(
          (flow2 * 1000 * 4.184 * (hot2 - cold2)) / 3600,
        );
      }
      if (tower === '3851' || tower === 'all') {
        const flow3 = item.U1_FM1_Flowrate || 0;
        const flow4 = item.U2_FM2_Flowrate || 0;
        const hot3 = item.r_Cooling_Water_Supply_Header_4101_TI_71_Scaled || 0;
        const cold3 = item.r_Cooling_Water_Supply_Header_3851_TI_44_Scaled || 0;
        const hot4 = item.Cooling_Water_Supply_Header_4101_TI_81_Scaled || 0;
        const cold4 = item.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0;

        capacities['3851_E03'].push(
          (flow3 * 1000 * 4.184 * (hot3 - cold3)) / 3600,
        );
        capacities['3851_E04'].push(
          (flow4 * 1000 * 4.184 * (hot4 - cold4)) / 3600,
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in capacities) {
      const avg = this.calculateAverage(capacities[key]);
      averages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      coolingCapacityAverages: averages,
      coolingCapacityTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }
  static calculateDriftLoss(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const result: Record<string, number[]> = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    };

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        result['4101_E01'].push((0.05 * (item.U3_FM3_Flowrate || 0)) / 100);
        result['4101_E02'].push((0.05 * (item.U4_FM4_Flowrate || 0)) / 100);
      }
      if (tower === '3851' || tower === 'all') {
        result['3851_E03'].push((0.05 * (item.U1_FM1_Flowrate || 0)) / 100);
        result['3851_E04'].push((0.05 * (item.U2_FM2_Flowrate || 0)) / 100);
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in result) {
      const avg = this.calculateAverage(result[key]);
      averages[key] = avg;
      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      driftLossAverages: averages,
      driftLossTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
      rawDriftLoss: result,
    };
  }

  static calculateEvaporationLoss(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const result: Record<string, number[]> = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    };

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        const evap1 =
          0.00085 *
          1.8 *
          (item.U3_FM3_Flowrate || 0) *
          ((item.r_Cooling_Water_Supply_Header_4101_TI_44_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0));
        const evap2 =
          0.00085 *
          1.8 *
          (item.U4_FM4_Flowrate || 0) *
          ((item.r_Cooling_Water_Supply_Header_4101_TI_54_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_4101_TI_51_Scaled || 0));
        result['4101_E01'].push(evap1);
        result['4101_E02'].push(evap2);
      }
      if (tower === '3851' || tower === 'all') {
        const evap3 =
          0.00085 *
          1.8 *
          (item.U1_FM1_Flowrate || 0) *
          ((item.r_Cooling_Water_Supply_Header_4101_TI_71_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_3851_TI_44_Scaled || 0));
        const evap4 =
          0.00085 *
          1.8 *
          (item.U2_FM2_Flowrate || 0) *
          ((item.Cooling_Water_Supply_Header_4101_TI_81_Scaled || 0) -
            (item.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0));
        result['3851_E03'].push(evap3);
        result['3851_E04'].push(evap4);
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in result) {
      const avg = this.calculateAverage(result[key]);
      averages[key] = avg;
      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      evaporationLossAverages: averages,
      evaporationLossTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
      rawEvapLoss: result,
    };
  }

  static calculateCOC(
    circConductivity: number,
    makeupConductivity: number,
  ): number {
    return makeupConductivity !== 0 ? circConductivity / makeupConductivity : 0;
  }

  static calculateBlowdownRate(
    evapLoss: Record<string, number[]>,
    COC: number,
  ): {
    blowdownRateAverages: Record<string, number>;
    blowdownRateTotals: Record<string, number>;
    rawBlowdownRate: Record<string, number[]>;
  } {
    const result: Record<string, number[]> = {};

    for (const key in evapLoss) {
      result[key] = evapLoss[key].map((evap) =>
        COC !== 1 ? evap / (COC - 1) : 0,
      );
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in result) {
      const avg = this.calculateAverage(result[key]);
      averages[key] = avg;
      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      blowdownRateAverages: averages,
      blowdownRateTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
      rawBlowdownRate: result,
    };
  }

  static calculateMakeupWater(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
    COC: number = 3,
  ) {
    const driftLoss = this.calculateDriftLoss(data, tower).rawDriftLoss;
    const evaporationLossResult = this.calculateEvaporationLoss(data, tower);
    const evaporationLoss = evaporationLossResult.rawEvapLoss;
    const blowdownRate = this.calculateBlowdownRate(
      evaporationLoss,
      COC,
    ).rawBlowdownRate;

    const makeupWater: Record<string, number[]> = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    };

    for (const key in makeupWater) {
      const count = Math.min(
        evaporationLoss[key]?.length || 0,
        blowdownRate[key]?.length || 0,
        driftLoss[key]?.length || 0,
      );
      for (let i = 0; i < count; i++) {
        makeupWater[key].push(
          (driftLoss[key][i] || 0) +
            (evaporationLoss[key][i] || 0) +
            (blowdownRate[key][i] || 0),
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in makeupWater) {
      const avg = this.calculateAverage(makeupWater[key]);
      averages[key] = avg;
      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      makeupWaterAverages: averages,
      makeupWaterTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }

  static calculateWaterEfficiencyIndex(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ): {
    waterEfficiencyAverages: Record<string, number>;
    waterEfficiencyTotals: Record<string, number>;
    rawWaterEfficiency: Record<string, number[]>;
  } {
    // Step 1: Get cooling capacity (evaporation loss assumed as proxy here)
    const evaporationLoss = this.calculateEvaporationLoss(
      data,
      tower,
    ).rawEvapLoss;

    // Step 2: Get makeup water (which internally uses drift + blowdown + evaporation)
    const makeupWater = this.calculateMakeupWater(
      data,
      tower,
    ).makeupWaterAverages;

    // Step 3: Prepare output containers
    const rawEfficiency: Record<string, number[]> = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    };
    const efficiencyAverages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    // Step 4: Compute water efficiency as (cooling capacity / makeup)
    for (const key in rawEfficiency) {
      const coolingArray = evaporationLoss[key] || [];
      const makeupAverage = makeupWater[key] || 1; // Prevent divide by zero
      rawEfficiency[key] = coolingArray.map((cool) =>
        makeupAverage !== 0 ? cool / makeupAverage : 0,
      );

      const avg = this.calculateAverage(rawEfficiency[key]);
      efficiencyAverages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      waterEfficiencyAverages: efficiencyAverages,
      waterEfficiencyTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
      rawWaterEfficiency: rawEfficiency,
    };
  }

  static calculateFanSpeed(
    data: any[],
    tower: '4101' | '3851' | 'all' = 'all',
  ) {
    const fanSpeeds: Record<string, number[]> = {
      '4101_E01': [],
      '4101_E02': [],
      '3851_E03': [],
      '3851_E04': [],
    };

    for (const item of data) {
      if (tower === '4101' || tower === 'all') {
        fanSpeeds['4101_E01'].push(
          item.r_Inverter1_Speed_4101_E05_Q01_Scaled || 0,
        );
        fanSpeeds['4101_E02'].push(
          item.r_Inverter2_Speed_4101_E06_Q01_Scaled || 0,
        );
      }
      if (tower === '3851' || tower === 'all') {
        fanSpeeds['3851_E03'].push(
          item.r_Inverter3_Speed_3851_E07_Q01_Scaled || 0,
        );
        fanSpeeds['3851_E04'].push(
          item.r_Inverter4_Speed_3851_E08_Q01_Scaled || 0,
        );
      }
    }

    const averages: Record<string, number> = {};
    let total4101 = 0;
    let total3851 = 0;

    for (const key in fanSpeeds) {
      const avg = this.calculateAverage(fanSpeeds[key]);
      averages[key] = avg;

      if (key.startsWith('4101')) total4101 += avg;
      if (key.startsWith('3851')) total3851 += avg;
    }

    return {
      fanSpeedAverages: averages,
      fanSpeedTotals: {
        '4101': total4101,
        '3851': total3851,
        all: total4101 + total3851,
        total_avaerage: total4101 + total3851 / 2,
      },
    };
  }
}
