/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** ---------------------------------------------------
   *  DASHBOARD 1 — BASIC LEVEL
   * --------------------------------------------------- */

  //  Metrics
  @Get('operator-level')
  async getDashboard1Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Electrical Stability Chart
  @Get('operator-level/electrical-stability')
  async getElectricalStabilityChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.electricalStability;
  }

  // Load Sharing Chart
  @Get('operator-level/load-sharing')
  async getLoadSharingChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.phaseBalanceEffectiveness;
  }

  // Current Imbalance + Neutral Current Chart
  @Get('operator-level/current-balance')
  async getCurrentImbalanceNeutralChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.CurrentImbalanceNeutral;
  }

  // Engine Thermal Chart
  @Get('operator-level/engine-thermal')
  async getEngineThermalChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.engineThermal;
  }

  // Lubrication Chart
  @Get('operator-level/lube-pressure')
  async getLubricationChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.lubrication;
  }

  // Fuel Demand Chart
  @Get('operator-level/fuel-demand')
  async getFuelDemandChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.fuelDemand;
  }

  /** ---------------------------------------------------
   *  DASHBOARD 2 — ENGINEER LEVEL
   * --------------------------------------------------- */

  // Metrics
  @Get('electrical-health')
  async getDashboard2Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Phase Balance Effectiveness Chart
  @Get('electrical-health/phase-balance')
  async getPhaseBalanceEffectivenessChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.loadSharing;
  }

  // Voltage Quality & Symmetry Chart
  @Get('electrical-health/voltage-quality')
  async getVoltageQualitySymmetryChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.voltageQualitySymmetry;
  }

  // Load vs Power Factor Chart
  @Get('electrical-health/load-power-factor')
  async getLoadVsPowerFactorChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.loadVsPowerFactor;
  }

  // Electro–Mechanical Stress Chart
  @Get('electrical-health/electro-mechanical-stress')
  async getElectroMechanicalStressChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.electroMechanicalStress;
  }

  // Losses & Thermal Stress Chart
  @Get('electrical-health/losses-thermal')
  async getLossesThermalStressChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.lossesThermalStress;
  }

  // Frequency Regulation Effectiveness Chart
  @Get('electrical-health/frequency-regulation')
  async getFrequencyRegulationEffectivenessChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.frequencyRegulationEffectiveness;
  }

  // Current & Voltage Imbalance Chart
  @Get('electrical-health/current-voltage-imbalance')
  async getCurrentVoltageImbalanceChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.currentBalanceNeutral;
  }

  // Chart 1: combustion Air Temperature vs Boost Pressure
  @Get('thermal-health/combustion-air')
  async getIntakeBoostChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard3Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).intakeBoost ?? [];
  }

  // Chart 2: Cooling Margin
  @Get('thermal-health/cooling-margin')
  async getCoolingMarginChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard3Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).coolingMargin ?? [];
  }

  // Engine Thermal Chart
  @Get('thermal-health/thermal-performance')
  async getThermalPerformanceChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.engineThermal;
  }

  /** Chart 3: Voltage Imbalance vs LL Average Voltage */
  @Get('thermal-health/cooling-efficiency')
  async getVoltageImbalanceChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.voltageQualitySymmetry;
  }

  // Load vs Power Factor Chart
  @Get('thermal-health/thermal-stress')
  async getThermalStressAlertChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard3Data(
      mode,
      start,
      end,
    );
    return charts.thermalStress;
  }

  /** ---------------------------------------------------
   *  DASHBOARD 4 — lubrication LEVEL
   * --------------------------------------------------- */

  // Metrics endpoint
  // @Get('lubrication')
  // async getDashboard4Metrics(
  //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
  //   @Query('start') start?: string,
  //   @Query('end') end?: string,
  // ) {
  //   const { metrics } = await this.dashboardService.getDashboard4Data(
  //     mode,
  //     start,
  //     end,
  //   );
  //   return metrics;
  // }

  // Chart 1: Lubrication Risk Index
  @Get('lubrication/lubrication-health')
  async getLubricationRiskChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard4Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).lubricationRiskIndex ?? [];
  }

  // Chart 2: Oil Pressure & Engine Speed
  @Get('lubrication/lub-pressure-response')
  async getOilPressureEngineSpeed(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard4Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).oilPressureEngineSpeed ?? [];
  }

  // Chart 3: Boost & Fuel Outlet Pressure
  @Get('lubrication/air-fuel-profile')
  async getBoostFuelOutlet(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard4Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).boostFuelOutlet ?? [];
  }

  // Chart 4: Boost Pressure & Load%
  @Get('lubrication/turbo-effectiveness')
  async getBoostLoadChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard4Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).boostLoad ?? [];
  }

  // Chart 5: Fuel Outlet Pressure & Biometric Pressure
  @Get('lubrication/fuel-ambient-pressure')
  async getFuelOutletBiometricChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard4Data(
      mode,
      start,
      end,
    );
    return (charts as Record<string, any[]>).fuelOutletBiometric ?? [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 5 — FUEL & EFFICIENCY
   * --------------------------------------------------- */

  @Get('fuel-combustion/fuel-consumption-load')
  async getFuelRateLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).fuelRateLoad ?? [];
  }
  @Get('fuel-combustion/fuel-flow-variability')
  async getFuelRateChange(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).fuelFlowRateChange ?? [];
  }

  @Get('fuel-combustion/air-fuel-effectiveness')
  async getAirFuelEffectiveness(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).airFuelEffectiveness ?? [];
  }

  @Get('fuel-combustion/fuel-generator-efficiency')
  async getFuelGeneratorEfficiency(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).specificFuelConsumption ?? [];
  }

  @Get('fuel-combustion/combustion-mixture')
  async getHeatRate(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).heatRate ?? [];
  }

  @Get('fuel-combustion/injection-system-health')
  async getInjectionSystemHealth(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard5Data(
      mode,
      start,
      end,
    );
    return (charts as any).fuelRateOutlet ?? [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 6 — ENGINE PERFORMANCE & TORQUE
   * --------------------------------------------------- */

  @Get('performance-general')
  async getDashboard6Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return metrics;
  }

  @Get('performance-general/torque-speed-characteristics')
  async getTorqueVsRunningTimeChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).engineTorqueVsRunningTime ?? [];
  }

  @Get('performance-general/torque-fuel-relationship')
  async getFuelRateVsTorqueChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).fuelRateVsTorque ?? [];
  }
  @Get('performance-general/generator-oscillation')
  async getTorqueGeneratorOscillationChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).oscillationIndex ?? [];
  }

  // @Get('performance-general/rpm-stability')
  // async getAverageEngineSpeedChart(
  //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
  //   @Query('start') start?: string,
  //   @Query('end') end?: string,
  // ) {
  //   const { charts } = await this.dashboardService.getDashboard6Data(
  //     mode,
  //     start,
  //     end,
  //   );
  //   return (charts as any).averageEngineSpeed ?? [];
  // }

  @Get('performance-general/rpm-stability')
  async getAverageEngineSpeedChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );

    const averageEngineSpeedData = (charts as any).averageEngineSpeed ?? [];
    const rpmStabilityData = (charts as any).rpmStabilityIndex ?? [];

    // ✅ Separate objects return karein
    return {
      averageEngineSpeed: averageEngineSpeedData,
      rpmStabilityIndex: rpmStabilityData,
    };
  }

  @Get('performance-general/output-efficiency')
  async getGensetPowerFactorChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).gensetPowerFactor ?? [];
  }
  @Get('performance-general/multi-dimensional-stress')
  async getMultiDimensionalStress(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).mechanicalStress ?? [];
  }
  @Get('performance-load/load-impact-speed')
  async getRPMStabilityIndex(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).rpmStabilityIndex ?? [];
    // const loadPercentData = (charts as any).loadPercent ?? [];
    // const rpmStabilityData = (charts as any).rpmStabilityIndex ?? [];

    // // ✅ Separate objects return karein
    // return {
    //   loadPercent: loadPercentData,
    //   rpmStabilityIndex: rpmStabilityData,
    // };
  }

  // @Get('performance-load/oscillation-behavior')
  // async getOscillationIndex(
  //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
  //   @Query('start') start?: string,
  //   @Query('end') end?: string,
  // ) {
  //   const { charts } = await this.dashboardService.getDashboard6Data(
  //     mode,
  //     start,
  //     end,
  //   );

  //   const oscillationData = (charts as any).oscillationIndex ?? [];
  //   const loadPercentData = (charts as any).loadPercent ?? [];

  //   // ✅ Separate objects return karein
  //   return {
  //     oscillationIndex: oscillationData,
  //     loadPercent: loadPercentData,
  //   };
  // }
  @Get('performance-load/oscillation-behavior')
  async getOscillationIndex(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );

    return (charts as any).oscillationIndex ?? [];
  }
  @Get('performance-load/fuel-demand-load')
  async getFuelConsumption(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).fuelConsumption ?? [];

    // const fuelConsumptionData = (charts as any).fuelConsumption ?? [];
    // const loadPercentData = (charts as any).loadPercent ?? [];

    // // ✅ Separate objects return karein
    // return {
    //   fuelConsumption: fuelConsumptionData,
    //   loadPercent: loadPercentData,
    // };
  }
  @Get('performance-load/efficiency-under-load')
  async getEfficiencyUnderLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).loadPercent ?? [];
  }
  @Get('performance-load/torque-response-load')
  async getTorqueResponseLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboard6Data(
      mode,
      start,
      end,
    );
    return (charts as any).torqueResponseLoad ?? [];
  }
}
