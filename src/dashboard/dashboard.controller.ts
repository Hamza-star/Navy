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
    const { charts } = await this.dashboardService.getDashboard1Data(
      mode,
      start,
      end,
    );
    return charts.loadSharing;
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
    return charts.currentImbalanceNeutral;
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
    const { charts } = await this.dashboardService.getDashboard2Data(
      mode,
      start,
      end,
    );
    return charts.phaseBalanceEffectiveness;
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

  @Get('fuel-combustion/specific-fuel-consumption')
  async getSpecificFuelConsumption(
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
}
