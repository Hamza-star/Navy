import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalysisData } from './schemas/analysis.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';
//import { TowerDataProcessor } from 'src/helpers/towerdataformulating-utils';
@Injectable()
export class AnalysisService {
  constructor(
    @InjectModel(AnalysisData.name)
    private readonly AnalysisModel: Model<AnalysisData>,
    private readonly mongoDateFilter: MongoDateFilterService,
  ) {}

  async getAnalysisDataChart1(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart2(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart3(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart4(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart5(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart6(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart7(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart8(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart9(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart10(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart11(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart12(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart13(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart14(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart15(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart16(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }

  async getAnalysisDataChart17(dto: {
    date?: string;
    range?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  }) {
    // Initialize the query filter
    const filter: any = {};

    // Handle date range filtering
    if (dto.range) {
      // Use predefined range
      const dateRange = this.mongoDateFilter.getDateRangeFilter(dto.range);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.fromDate && dto.toDate) {
      // Use custom date range
      const from = new Date(dto.fromDate);
      const to = new Date(dto.toDate);
      const dateRange = this.mongoDateFilter.getCustomDateRange(from, to);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    } else if (dto.date) {
      // Use single date
      const dateRange = this.mongoDateFilter.getSingleDateFilter(dto.date);
      filter.timestamp = {
        $gte: dateRange.$gte,
        $lte: dateRange.$lte,
      };
    }

    // Handle time range filtering if provided
    if (dto.startTime && dto.endTime) {
      const timeFilter = this.mongoDateFilter.getCustomTimeRange(
        dto.startTime,
        dto.endTime,
      );
      Object.assign(filter, timeFilter);
    }

    // If no tower type specified, return all data
    if (!dto.towerType) {
      return await this.AnalysisModel.find(filter).lean().exec();
    }

    // Create a projection that includes only fields for the specified tower type
    const projection: any = {
      _id: 1,
      timestamp: 1,
      UNIXtimestamp: 1,
    };

    // Get the first document to analyze the fields
    const sampleDoc = await this.AnalysisModel.findOne(filter).lean().exec();

    if (!sampleDoc) {
      return [];
    }

    // Find all fields that start with the towerType prefix
    const towerPrefix = `${dto.towerType}_`;
    Object.keys(sampleDoc).forEach((field) => {
      if (field.startsWith(towerPrefix)) {
        projection[field] = 1;
      }
    });

    // Execute query with projection
    const data = await this.AnalysisModel.find(filter, projection)
      .lean()
      .exec();

    return data;
  }
}
