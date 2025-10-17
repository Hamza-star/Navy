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
  @Get('engineer-level')
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
  @Get('engineer-level/phase-balance-effectiveness')
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
  @Get('engineer-level/voltage-quality-symmetry')
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
  @Get('engineer-level/load-vs-powerfactor')
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
  @Get('engineer-level/electromechanical-stress')
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
  @Get('engineer-level/losses-thermal-stress')
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
  @Get('engineer-level/frequency-regulation-effectiveness')
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
  @Get('engineer-level/current-voltage-imbalance')
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
}
