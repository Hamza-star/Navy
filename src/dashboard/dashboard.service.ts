import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DashboardData } from './schemas/dashboard.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
import { TowerDataProcessor } from 'src/helpers/towerdataformulating-utils';
@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('DashboardData')
    private readonly DashboardModel: Model<DashboardData>,
    private readonly mongoDateFilter: MongoDateFilterService,
  ) {}

  async getDashboardDataChart1(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};
    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const rangeprocessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
    );
    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
    );
    const efficiencyProcessed = TowerDataProcessor.calculateEfficiency(
      data,
      dto.towerType || 'all',
    );
    const avgWaterConsumptionProcessed =
      TowerDataProcessor.calculateAvgWaterConsumption(
        data,
        dto.towerType || 'all',
      );
    const coolingCapacityProcessed =
      TowerDataProcessor.calculateCoolingCapacity(data, dto.towerType || 'all');

    const driftLossProcessed = TowerDataProcessor.calculateDriftLoss(
      data,
      dto.towerType || 'all',
    );
    const evaporationLossProcessed =
      TowerDataProcessor.calculateEvaporationLoss(data, dto.towerType || 'all');

    // 👇 Replace these dummy values later with actual conductivity tag values
    const circConductivity = 1500;
    const makeupConductivity = 500;
    const COCProcessed = TowerDataProcessor.calculateCOC(
      circConductivity,
      makeupConductivity,
    );

    const blowdownRateProcessed = TowerDataProcessor.calculateBlowdownRate(
      evaporationLossProcessed.rawEvapLoss, // ✅ FIXED: pass the rawEvapLoss
      COCProcessed,
    );

    const makeupWaterProcessed = TowerDataProcessor.calculateMakeupWater(
      data,
      dto.towerType || 'all',
      COCProcessed,
    );
    const waterEfficiencyIndex =
      TowerDataProcessor.calculateWaterEfficiencyIndex(
        data,
        dto.towerType || 'all',
      );

    return {
      // data: data,
      range: rangeprocessed,
      approach: approachProcessed,
      efficiency: efficiencyProcessed,
      waterConsumption: avgWaterConsumptionProcessed,
      coolingCapacity: coolingCapacityProcessed,
      driftloss: [
        driftLossProcessed.driftLossAverages,
        driftLossProcessed.driftLossTotals,
      ],
      evaporationLoss: [
        evaporationLossProcessed.evaporationLossAverages,
        evaporationLossProcessed.evaporationLossTotals,
      ],
      COC: COCProcessed,
      BlowDownRate: [
        blowdownRateProcessed.blowdownRateAverages,
        blowdownRateProcessed.blowdownRateTotals,
      ],
      makeupWater: makeupWaterProcessed.makeupWaterAverages,
      avgWaterEfficiencyIndex: [
        waterEfficiencyIndex.waterEfficiencyAverages,
        waterEfficiencyIndex.waterEfficiencyTotals,
      ],
      avgEnergyUsage: 0,
      coolingLoad: 0,
    };
  }
  async getDashboardDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance

    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
    );
    const efficiencyProcessed = TowerDataProcessor.calculateEfficiency(
      data,
      dto.towerType || 'all',
    );
    return {
      approach: approachProcessed,
      efficiency: efficiencyProcessed,
    };
  }
  async getDashboardDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const rangeprocessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
    );
    const fansprocessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
    );
    return {
      range: rangeprocessed,
      fans: fansprocessed,
    };
  }
  async getDashboardDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const coolingCapacityProcessed =
      TowerDataProcessor.calculateCoolingCapacity(data, dto.towerType || 'all');

    const driftLossProcessed = TowerDataProcessor.calculateDriftLoss(
      data,
      dto.towerType || 'all',
    );
    const evaporationLossProcessed =
      TowerDataProcessor.calculateEvaporationLoss(data, dto.towerType || 'all');

    // 👇 Replace these dummy values later with actual conductivity tag values
    const circConductivity = 1500;
    const makeupConductivity = 500;
    const COCProcessed = TowerDataProcessor.calculateCOC(
      circConductivity,
      makeupConductivity,
    );

    const blowdownRateProcessed = TowerDataProcessor.calculateBlowdownRate(
      evaporationLossProcessed.rawEvapLoss, // ✅ FIXED: pass the rawEvapLoss
      COCProcessed,
    );

    const makeupWaterProcessed = TowerDataProcessor.calculateMakeupWater(
      data,
      dto.towerType || 'all',
      COCProcessed,
    );
    const waterEfficiencyIndex =
      TowerDataProcessor.calculateWaterEfficiencyIndex(
        data,
        dto.towerType || 'all',
      );
    return {
      driftloss: [
        driftLossProcessed.driftLossAverages,
        driftLossProcessed.driftLossTotals,
      ],
      evaporationLoss: [
        evaporationLossProcessed.evaporationLossAverages,
        evaporationLossProcessed.evaporationLossTotals,
      ],
      COC: COCProcessed,
      BlowDownRate: [
        blowdownRateProcessed.blowdownRateAverages,
        blowdownRateProcessed.blowdownRateTotals,
      ],
      makeupWater: makeupWaterProcessed.makeupWaterAverages,
      avgWaterEfficiencyIndex: [
        waterEfficiencyIndex.waterEfficiencyAverages,
        waterEfficiencyIndex.waterEfficiencyTotals,
      ],
    };
  }
  async getDashboardDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // const data = await this.DashboardModel.find(query).lean(); // use lean for performance

    return {
      COC: 0,
      Conductivity: 0,
    };
  }
  async getDashboardDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    //const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    return {
      Fan_Power_Consumption: 0,
      Fan_Efficiency_Index: 0,
    };
  }
  async getDashboardDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const rangeprocessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
    );
    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
    );
    return {
      Cooling_Load: 0,
      range: rangeprocessed,
      approach: approachProcessed,
    };
  }
  async getDashboardDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    //const data = await this.DashboardModel.find(query).lean(); // use lean for performance

    return {
      Tower_Utilisation_Rate: 0,
      Heat_Reject_Rate: 0,
    };
  }
  async getDashboardDataChart9(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const rangeprocessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
    );
    const fansprocessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
    );
    return {
      range: rangeprocessed,
      fans: fansprocessed,
    };
  }
  async getDashboardDataChart10(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
    );
    const efficiencyProcessed = TowerDataProcessor.calculateEfficiency(
      data,
      dto.towerType || 'all',
    );
    return {
      approach: approachProcessed,
      efficiency: efficiencyProcessed,
    };
  }
  async getDashboardDataChart11(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // const data = await this.DashboardModel.find(query).lean(); // use lean for performance

    return {
      Fan_Power_Consumption: 0,
      Fan_Efficiency_Index: 0,
    };
  }
  async getDashboardDataChart12(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const coolingCapacityProcessed =
      TowerDataProcessor.calculateCoolingCapacity(data, dto.towerType || 'all');

    const driftLossProcessed = TowerDataProcessor.calculateDriftLoss(
      data,
      dto.towerType || 'all',
    );
    const evaporationLossProcessed =
      TowerDataProcessor.calculateEvaporationLoss(data, dto.towerType || 'all');

    // 👇 Replace these dummy values later with actual conductivity tag values
    const circConductivity = 1500;
    const makeupConductivity = 500;
    const COCProcessed = TowerDataProcessor.calculateCOC(
      circConductivity,
      makeupConductivity,
    );

    const blowdownRateProcessed = TowerDataProcessor.calculateBlowdownRate(
      evaporationLossProcessed.rawEvapLoss, // ✅ FIXED: pass the rawEvapLoss
      COCProcessed,
    );

    const makeupWaterProcessed = TowerDataProcessor.calculateMakeupWater(
      data,
      dto.towerType || 'all',
      COCProcessed,
    );
    const waterEfficiencyIndex =
      TowerDataProcessor.calculateWaterEfficiencyIndex(
        data,
        dto.towerType || 'all',
      );
    return {
      driftloss: [
        driftLossProcessed.driftLossAverages,
        driftLossProcessed.driftLossTotals,
      ],
      evaporationLoss: [
        evaporationLossProcessed.evaporationLossAverages,
        evaporationLossProcessed.evaporationLossTotals,
      ],
      COC: COCProcessed,
      BlowDownRate: [
        blowdownRateProcessed.blowdownRateAverages,
        blowdownRateProcessed.blowdownRateTotals,
      ],
      makeupWater: makeupWaterProcessed.makeupWaterAverages,
      avgWaterEfficiencyIndex: [
        waterEfficiencyIndex.waterEfficiencyAverages,
        waterEfficiencyIndex.waterEfficiencyTotals,
      ],
    };
  }
  async getDashboardDataChart13(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    // const data = await this.DashboardModel.find(query).lean(); // use lean for performance

    return {
      Normalised_Water_Usage: 0,
      Drift_To_Evaporation_Ratio: 0,
    };
  }
  async getDashboardDataChart14(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const coolingCapacityProcessed =
      TowerDataProcessor.calculateCoolingCapacity(data, dto.towerType || 'all');

    const driftLossProcessed = TowerDataProcessor.calculateDriftLoss(
      data,
      dto.towerType || 'all',
    );
    const evaporationLossProcessed =
      TowerDataProcessor.calculateEvaporationLoss(data, dto.towerType || 'all');

    // 👇 Replace these dummy values later with actual conductivity tag values
    const circConductivity = 1500;
    const makeupConductivity = 500;
    const COCProcessed = TowerDataProcessor.calculateCOC(
      circConductivity,
      makeupConductivity,
    );

    const blowdownRateProcessed = TowerDataProcessor.calculateBlowdownRate(
      evaporationLossProcessed.rawEvapLoss, // ✅ FIXED: pass the rawEvapLoss
      COCProcessed,
    );

    const makeupWaterProcessed = TowerDataProcessor.calculateMakeupWater(
      data,
      dto.towerType || 'all',
      COCProcessed,
    );
    const waterEfficiencyIndex =
      TowerDataProcessor.calculateWaterEfficiencyIndex(
        data,
        dto.towerType || 'all',
      );
    return {
      driftloss: [
        driftLossProcessed.driftLossAverages,
        driftLossProcessed.driftLossTotals,
      ],
      evaporationLoss: [
        evaporationLossProcessed.evaporationLossAverages,
        evaporationLossProcessed.evaporationLossTotals,
      ],
      COC: COCProcessed,
      BlowDownRate: [
        blowdownRateProcessed.blowdownRateAverages,
        blowdownRateProcessed.blowdownRateTotals,
      ],
      makeupWater: makeupWaterProcessed.makeupWaterAverages,
      avgWaterEfficiencyIndex: [
        waterEfficiencyIndex.waterEfficiencyAverages,
        waterEfficiencyIndex.waterEfficiencyTotals,
      ],
    };
  }
  async getDashboardDataChart15(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const rangeprocessed = TowerDataProcessor.calculateRange(
      data,
      dto.towerType || 'all',
    );
    return {
      range: rangeprocessed,
    };
  }
  async getDashboardDataChart16(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

     const data = await this.DashboardModel.find(query).lean(); // use lean for performance
 const fansprocessed = TowerDataProcessor.calculateFanSpeed(
      data,
      dto.towerType || 'all',
    );
    return {
      Energy_Index: 0,
      fans: fansprocessed,
    };
  }
  async getDashboardDataChart17(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const approachProcessed = TowerDataProcessor.calculateApproach(
      data,
      dto.towerType || 'all',
    );
    
    return {
      approach: approachProcessed,
    };
  }
  async getDashboardDataChart18(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: '4101' | '3851' | 'all';
  }) {
    const query: any = {};

    if (dto.date) {
      query.timestamp = this.mongoDateFilter.getSingleDateFilter(dto.date);
    }
    if (dto.range) {
      query.timestamp = this.mongoDateFilter.getDateRangeFilter(dto.range);
    } else if (dto.fromDate && dto.toDate) {
      query.timestamp = this.mongoDateFilter.getCustomDateRange(
        new Date(dto.fromDate),
        new Date(dto.toDate),
      );
    }
    if (dto.startTime && dto.endTime) {
      Object.assign(
        query,
        this.mongoDateFilter.getCustomTimeRange(dto.startTime, dto.endTime),
      );
    }

    const data = await this.DashboardModel.find(query).lean(); // use lean for performance
    const coolingCapacityProcessed =
      TowerDataProcessor.calculateCoolingCapacity(data, dto.towerType || 'all');
    return {
      coolingCapacity: coolingCapacityProcessed,
    };
  }
}
