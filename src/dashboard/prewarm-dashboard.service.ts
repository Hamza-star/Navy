// /* eslint-disable @typescript-eslint/no-misused-promises */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
// import { Db } from 'mongodb';
// import * as moment from 'moment-timezone';
// import { cache } from 'utils/cache';

// @Injectable()
// export class PrewarmDashboardService implements OnModuleInit {
//   private collection;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.collection = this.db.collection('navy_historical');
//   }

//   async onModuleInit() {
//     console.log('🚀 Starting dashboard prewarm...');
//     await this.prewarmAllDashboards();

//     // ♻️ Auto-refresh cache every 30 minutes
//     setInterval(
//       async () => {
//         console.log('♻️ Refreshing dashboard cache...');
//         await this.prewarmAllDashboards();
//       },
//       30 * 60 * 1000,
//     );
//   }

//   /**
//    * Prewarm all dashboards at once
//    */
//   async prewarmAllDashboards() {
//     const start = performance.now();

//     const dashboards = [
//       {
//         name: 'dashboard1',
//         query: { Genset_Run_SS: { $gte: 1, $lte: 6 } },
//         projection: {
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Genset_Application_kW_Rating_PC2X: 1,
//           Averagr_Engine_Speed: 1,
//           Genset_L1L2_Voltage: 1,
//           Genset_L2L3_Voltage: 1,
//           Genset_L3L1_Voltage: 1,
//           Genset_Frequency_OP_calculated: 1,
//           Genset_L1_Current: 1,
//           Genset_L2_Current: 1,
//           Genset_L3_Current: 1,
//           Coolant_Temperature: 1,
//           Oil_Temperature: 1,
//           Oil_Pressure: 1,
//           Fuel_Rate: 1,
//           Total_Fuel_Consumption_calculated: 1,
//           Engine_Running_TIME_calculated: 1,
//           Battery_Voltage_calculated: 1,
//           Genset_Total_Power_Factor_calculated: 1,
//         },
//       },
//       {
//         name: 'dashboard2',
//         query: { Genset_Run_SS: { $gte: 1, $lte: 6 } },
//         projection: {
//           timestamp: 1,
//           Genset_L1_Active_Power: 1,
//           Genset_L2_Active_Power: 1,
//           Genset_L3_Active_Power: 1,
//           I2Rated: 1,
//           Genset_Total_kW: 1,
//           Genset_Application_kW_Rating_PC2X: 1,
//           Averagr_Engine_Speed: 1,
//           Genset_L1L2_Voltage: 1,
//           Genset_L2L3_Voltage: 1,
//           Genset_L3L1_Voltage: 1,
//           Genset_Frequency_OP_calculated: 1,
//           Genset_L1_Current: 1,
//           Genset_L2_Current: 1,
//           Genset_L3_Current: 1,
//           Coolant_Temperature: 1,
//           Oil_Temperature: 1,
//           Oil_Pressure: 1,
//           Fuel_Rate: 1,
//           Total_Fuel_Consumption_calculated: 1,
//           Engine_Running_TIME_calculated: 1,
//           Battery_Voltage_calculated: 1,
//           Genset_Total_Power_Factor_calculated: 1,
//         },
//       },
//       // ✅ Add dashboard3..dashboard6 here if needed
//     ];

//     for (const dash of dashboards) {
//       await this.prewarmDashboard(dash.name, dash.query, dash.projection);
//     }

//     const total = (performance.now() - start).toFixed(2);
//     console.log(`🔥 All dashboards prewarmed in ${total} ms`);
//   }

//   /**
//    * Fetch dashboard data (cached)
//    */
//   private async prewarmDashboard(
//     name: string,
//     query: any,
//     projection: any,
//   ): Promise<any[]> {
//     const cacheKey = `dashboard_${name}`;

//     // ⚡ Return instantly if cached
//     if (cache.has(cacheKey)) {
//       console.log(`⚡ Using cached data for ${name}`);
//       return cache.get(cacheKey);
//     }

//     console.log(`Fetching fresh data for ${name}...`);
//     const pipeline = [
//       { $match: query },
//       { $project: projection },
//       { $sort: { timestamp: 1 } },
//     ];

//     const docs = await this.collection.aggregate(pipeline).toArray();

//     // Format timestamps for consistency
//     const formatted = docs.map((d) => ({
//       ...d,
//       timestamp: moment(d.timestamp)
//         .tz('Asia/Karachi')
//         .format('YYYY-MM-DD HH:mm:ss.SSS'),
//     }));

//     cache.set(cacheKey, formatted);
//     console.log(`✅ ${name} cached (${formatted.length} records)`);

//     return formatted;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

interface DashboardConfig {
  projection: Record<string, number>;
  metricsMapper: (doc: any, data?: any[]) => any;
  chartsMapper: (data: any[]) => Record<string, any[]>;
}

@Injectable()
export class DashboardService {
  private collection;
  private cache = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.collection = this.db.collection('navy_historical');
  }

  /** -------------------
   * Dashboard Configurations - SINGLE SOURCE OF TRUTH
   * ------------------- */
  private dashboardConfigs: Record<string, DashboardConfig> = {
    dashboard1: {
      projection: this.getProjectionFields([
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Averagr_Engine_Speed',
        'Genset_L1L2_Voltage',
        'Genset_L2L3_Voltage',
        'Genset_L3L1_Voltage',
        'Genset_Frequency_OP_calculated',
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Coolant_Temperature',
        'Oil_Temperature',
        'Oil_Pressure',
        'Fuel_Rate',
        'Total_Fuel_Consumption_calculated',
        'Engine_Running_TIME_calculated',
        'Battery_Voltage_calculated',
        'Genset_Total_Power_Factor_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetrics(doc, this.DASH1_METRICS),
      chartsMapper: (data: any[]) => this.mapCharts(data, this.DASH1_CHARTS),
    },
    dashboard2: {
      projection: this.getProjectionFields([
        'Genset_L1_Active_Power',
        'Genset_L2_Active_Power',
        'Genset_L3_Active_Power',
        'I2Rated',
        ...this.getDashboard1Fields(),
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard2(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard2(data),
    },
    dashboard3: {
      projection: this.getProjectionFields([
        'Intake_Manifold3_Temperature',
        'Boost_Pressure',
        'Coolant_Temperature',
        'AfterCooler_Temperature',
        'Genset_LL_Avg_Voltage',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard3(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard3(data),
    },
    dashboard4: {
      projection: this.getProjectionFields([
        'Oil_Pressure',
        'Oil_Temperature',
        'Averagr_Engine_Speed',
        'Boost_Pressure',
        'Fuel_Outlet_Pressure_calculated',
        'Barometric_Absolute_Pressure',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard4(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard4(data),
    },
    dashboard5: {
      projection: this.getProjectionFields([
        'Fuel_Rate',
        'Boost_Pressure',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Fuel_Outlet_Pressure_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard5(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard5(data),
    },
    dashboard6: {
      projection: this.getProjectionFields([
        'Total_Fuel_Consumption_calculated',
        'Energy [kWh]',
        'Fuel_Consumption_Current_Run',
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Engine_Running_Time_calculated',
        'Fuel_Rate',
        'Averagr_Engine_Speed',
        'Genset_Total_Power_Factor_calculated',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard6(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard6(data),
    },
  };

  /** -------------------
   * IMPROVED: Unified Data Fetching Method with Smart Caching
   * ------------------- */
  async getDashboardData(
    dashboard: string,
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    // ✅ FIX: Clean parameters before creating cache key
    const cleanStart = start ? start.trim() : start;
    const cleanEnd = end ? end.trim() : end;

    const baseCacheKey = this.getBaseCacheKey(mode, cleanStart, cleanEnd);
    const dashboardCacheKey = `${baseCacheKey}_${dashboard}`;

    // ✅ First check if this specific dashboard is cached
    const cachedDashboard = this.getFromCache(dashboardCacheKey);
    if (cachedDashboard) {
      console.log(`⚡ Dashboard cache hit for: ${dashboardCacheKey}`);
      return cachedDashboard;
    }

    // ✅ Check if we already have the raw data cached
    const cachedRawData = this.getFromCache(baseCacheKey);

    let rawData: any[] = [];

    if (cachedRawData) {
      console.log(`⚡ Raw data cache hit for: ${baseCacheKey}`);
      rawData = cachedRawData;
    } else {
      // Fetch fresh data only if not in cache
      const config = this.dashboardConfigs[dashboard];
      if (!config) {
        throw new Error(`Dashboard ${dashboard} not found`);
      }

      const pipeline = this.buildAggregationPipeline(
        mode,
        config.projection,
        cleanStart,
        cleanEnd,
      );

      console.log('Executing pipeline for fresh data...');
      rawData = await this.collection.aggregate(pipeline).toArray();

      // ✅ Cache the raw data for future use
      this.setCache(baseCacheKey, rawData);
      console.log(
        `💾 Raw data cached for: ${baseCacheKey}, records: ${rawData.length}`,
      );
    }

    // ✅ Now process the data for specific dashboard
    const result = this.processDataForDashboard(dashboard, mode, rawData);

    // ✅ Cache the processed dashboard result
    this.setCache(dashboardCacheKey, result);
    console.log(`💾 Dashboard cached: ${dashboardCacheKey}`);

    return result;
  }

  /** -------------------
   * IMPROVED: Batch Multiple Dashboards - Single Fetch with Smart Caching
   * ------------------- */
  async getMultipleDashboards(
    dashboards: string[],
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const results: Record<string, any> = {};
    const cleanStart = start ? start.trim() : start;
    const cleanEnd = end ? end.trim() : end;

    const baseCacheKey = this.getBaseCacheKey(mode, cleanStart, cleanEnd);

    // ✅ Check which dashboards are already cached
    const uncachedDashboards: string[] = [];
    const cachedResults: Record<string, any> = {};

    dashboards.forEach((dashboard) => {
      const dashboardCacheKey = `${baseCacheKey}_${dashboard}`;
      const cached = this.getFromCache(dashboardCacheKey);
      if (cached) {
        cachedResults[dashboard] = cached;
        console.log(`⚡ Using cached dashboard: ${dashboard}`);
      } else {
        uncachedDashboards.push(dashboard);
      }
    });

    // ✅ If all dashboards are cached, return immediately
    if (uncachedDashboards.length === 0) {
      return cachedResults;
    }

    let rawData: any[] = [];
    const cachedRawData = this.getFromCache(baseCacheKey);

    if (cachedRawData) {
      console.log(`⚡ Batch raw data cache hit for: ${baseCacheKey}`);
      rawData = cachedRawData;
    } else {
      // ✅ Fetch data only once for the uncached dashboards
      const firstUncached = uncachedDashboards[0];
      const config = this.dashboardConfigs[firstUncached];

      if (!config) {
        throw new Error(`Dashboard ${firstUncached} not found`);
      }

      // ✅ Use a combined projection that includes all required fields
      const combinedProjection = this.getCombinedProjection(uncachedDashboards);

      const pipeline = this.buildAggregationPipeline(
        mode,
        combinedProjection,
        cleanStart,
        cleanEnd,
      );

      console.log(
        `Executing single pipeline for ${uncachedDashboards.length} uncached dashboards...`,
      );
      rawData = await this.collection.aggregate(pipeline).toArray();

      // ✅ Cache the raw data
      this.setCache(baseCacheKey, rawData);
      console.log(
        `💾 Batch data cached for: ${baseCacheKey}, records: ${rawData.length}`,
      );
    }

    // ✅ Process data for each uncached dashboard
    await Promise.all(
      uncachedDashboards.map(async (dashboard) => {
        try {
          const result = this.processDataForDashboard(dashboard, mode, rawData);

          // Cache the processed result
          const dashboardCacheKey = `${baseCacheKey}_${dashboard}`;
          this.setCache(dashboardCacheKey, result);
          results[dashboard] = result;

          console.log(`💾 Cached dashboard: ${dashboard}`);
        } catch (error) {
          results[dashboard] = {
            error: error.message,
            metrics: {},
            charts: {},
          };
        }
      }),
    );

    // ✅ Combine cached and newly processed results
    return { ...cachedResults, ...results };
  }

  /** -------------------
   * FIXED: Aggregation Pipeline with Proper Date Handling
   * ------------------- */
  private buildAggregationPipeline(
    mode: string,
    projection: Record<string, number>,
    start?: string,
    end?: string,
  ): any[] {
    const pipeline: any[] = [];
    const matchStage: any = {};

    // ✅ FIX: Clean the parameters before using
    const cleanStart = start ? start.trim() : start;
    const cleanEnd = end ? end.trim() : end;

    console.log('Building pipeline with parameters:', {
      mode,
      cleanStart,
      cleanEnd,
    });

    if (mode === 'historic' && cleanStart && cleanEnd) {
      // ✅ FIX: Use exact string matching for historic mode
      matchStage.timestamp = {
        $gte: cleanStart,
        $lte: cleanEnd,
      };
      console.log('Historic mode query:', matchStage.timestamp);
    } else if (mode === 'range') {
      matchStage.Genset_Run_SS = { $gte: 1, $lte: 6 };
      console.log('Range mode query:', matchStage.Genset_Run_SS);
    } else if (mode === 'live') {
      // ✅ FIX: For live mode, get data from CURRENT DATE only, not yesterday
      const today = new Date();
      const todayStart = today.toISOString().split('T')[0] + ' 00:00:00';

      // If we have specific start/end for live mode, use them
      if (cleanStart && cleanEnd) {
        matchStage.timestamp = {
          $gte: cleanStart,
          $lte: cleanEnd,
        };
        console.log('Live mode with custom range:', matchStage.timestamp);
      } else {
        // Default: today's data
        matchStage.timestamp = { $gte: todayStart };
        console.log('Live mode default (today):', matchStage.timestamp);
      }
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Projection stage
    pipeline.push({ $project: projection });

    // Sort stage - string timestamps sort correctly in lexicographical order
    pipeline.push({ $sort: { timestamp: 1 } });

    return pipeline;
  }

  /** -------------------
   * NEW: Process cached data for specific dashboard
   * ------------------- */
  private processDataForDashboard(
    dashboard: string,
    mode: 'live' | 'historic' | 'range',
    rawData: any[],
  ) {
    const config = this.dashboardConfigs[dashboard];
    if (!config) {
      throw new Error(`Dashboard ${dashboard} not found`);
    }

    console.log(
      `Processing ${rawData.length} records for dashboard: ${dashboard}`,
    );

    if (!rawData.length) {
      console.log('No data found for dashboard:', dashboard);
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };
    }

    // Format timestamps
    const formattedData = rawData.map((doc) => ({
      ...doc,
      timestamp: this.formatStringTimestamp(doc.timestamp),
    }));

    const latest = formattedData[formattedData.length - 1];
    let metrics = config.metricsMapper(latest, formattedData);

    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDurationString(formattedData),
      };
    }

    return {
      metrics,
      charts: config.chartsMapper(formattedData),
    };
  }

  /** -------------------
   * FIXED: Base Cache Key (without extra spaces)
   * ------------------- */
  private getBaseCacheKey(mode: string, start?: string, end?: string): string {
    // ✅ FIX: Remove extra spaces and clean the parameters
    const cleanStart = start ? start.trim().replace(/\s+/g, '_') : 'none';
    const cleanEnd = end ? end.trim().replace(/\s+/g, '_') : 'none';

    return `data_${mode}_${cleanStart}_${cleanEnd}`;
  }

  /** -------------------
   * NEW: Combined Projection for Multiple Dashboards
   * ------------------- */
  private getCombinedProjection(dashboards: string[]): Record<string, number> {
    const allFields = new Set<string>();

    dashboards.forEach((dashboard) => {
      const config = this.dashboardConfigs[dashboard];
      if (config) {
        // Extract fields from projection
        Object.keys(config.projection).forEach((field) => {
          if (field !== 'timestamp') {
            allFields.add(field);
          }
        });
      }
    });

    // Return combined projection
    const projection: Record<string, number> = { timestamp: 1 };
    allFields.forEach((field) => {
      projection[field] = 1;
    });

    console.log('Combined projection fields:', Array.from(allFields));
    return projection;
  }

  /** -------------------
   * NEW: String Timestamp Formatter
   * ------------------- */
  private formatStringTimestamp(timestamp: any): string {
    if (!timestamp) return '';

    try {
      // If it's already in correct string format, return as is
      if (typeof timestamp === 'string' && timestamp.includes(' ')) {
        return timestamp;
      }

      // If it's a Date object or ISO string, convert to consistent format
      if (
        timestamp instanceof Date ||
        (typeof timestamp === 'string' && timestamp.includes('T'))
      ) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return String(timestamp);
        }

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Return as string for any other type
      return String(timestamp);
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return String(timestamp);
    }
  }

  /** -------------------
   * NEW: On Duration Calculator for String Timestamps
   * ------------------- */
  private calculateOnDurationString(data: any[]): number {
    if (data.length < 2) return 0;

    let duration = 0;
    for (let i = 1; i < data.length; i++) {
      try {
        const currentTime = new Date(data[i].timestamp).getTime();
        const previousTime = new Date(data[i - 1].timestamp).getTime();

        // Handle invalid dates
        if (isNaN(currentTime) || isNaN(previousTime)) continue;

        duration += (currentTime - previousTime) / 60000; // Convert to minutes
      } catch (error) {
        console.error('Error calculating duration between timestamps:', error);
        continue;
      }
    }
    return +duration.toFixed(2);
  }

  /** -------------------
   * NEW: Debug Method to Check Database Data
   * ------------------- */
  async debugDatabaseData(
    mode: 'live' | 'historic' | 'range' = 'live',
    start?: string,
    end?: string,
    limit: number = 5,
  ) {
    const cleanStart = start ? start.trim() : start;
    const cleanEnd = end ? end.trim() : end;

    const pipeline = this.buildAggregationPipeline(
      mode,
      { timestamp: 1, Genset_Run_SS: 1 },
      cleanStart,
      cleanEnd,
    );
    pipeline.push({ $limit: limit });

    const sampleData = await this.collection.aggregate(pipeline).toArray();

    return {
      query: pipeline[0]?.$match || {},
      sampleCount: sampleData.length,
      sampleData: sampleData.map((doc) => ({
        timestamp: doc.timestamp,
        timestampType: typeof doc.timestamp,
        Genset_Run_SS: doc.Genset_Run_SS,
        formattedTimestamp: this.formatStringTimestamp(doc.timestamp),
      })),
      allRecordsCount: await this.collection.countDocuments(
        pipeline[0]?.$match || {},
      ),
    };
  }

  /** -------------------
   * Smart Projection Builder
   * ------------------- */
  private getProjectionFields(fields: string[]): Record<string, number> {
    const projection: Record<string, number> = { timestamp: 1 };
    fields.forEach((field) => {
      projection[field] = 1;
    });
    return projection;
  }

  private getDashboard1Fields(): string[] {
    return [
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
      'Averagr_Engine_Speed',
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_Frequency_OP_calculated',
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
      'Coolant_Temperature',
      'Oil_Temperature',
      'Oil_Pressure',
      'Fuel_Rate',
      'Total_Fuel_Consumption_calculated',
      'Engine_Running_TIME_calculated',
      'Battery_Voltage_calculated',
      'Genset_Total_Power_Factor_calculated',
    ];
  }

  /** -------------------
   * FIXED: Enhanced Cache Management with Better Logging
   * ------------------- */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`⚡ Cache hit for: ${key}`);
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
      console.log(
        `🗑️ Expired cache removed: ${key} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`,
      );
    }

    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(
      `💾 Cache set for: ${key}, data length: ${Array.isArray(data) ? data.length : 'object'}, TTL: ${this.CACHE_TTL / 1000}s`,
    );
  }

  /** -------------------
   * NEW: Cache Management Methods
   * ------------------- */
  clearCache(dashboard?: string): void {
    if (dashboard) {
      // Clear specific dashboard cache
      const keysToDelete: string[] = [];
      this.cache.forEach((value, key) => {
        if (key.includes(`_${dashboard}`)) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach((key) => {
        this.cache.delete(key);
        console.log(`🗑️ Cleared cache: ${key}`);
      });

      console.log(
        `🧹 Cleared ${keysToDelete.length} cache entries for ${dashboard}`,
      );
    } else {
      // Clear all cache
      const beforeSize = this.cache.size;
      this.cache.clear();
      console.log(`🧹 Cleared all cache: ${beforeSize} entries removed`);
    }
  }

  getCacheInfo(): any {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Math.round((now - value.timestamp) / 1000) + 's',
      dataType: Array.isArray(value.data)
        ? `array[${value.data.length}]`
        : typeof value.data,
      expired: now - value.timestamp > this.CACHE_TTL,
    }));

    return {
      totalEntries: this.cache.size,
      ttl: this.CACHE_TTL / 1000 + 's',
      entries,
    };
  }

  /** -------------------
   * NEW: Pre-warm Cache for Better Performance
   * ------------------- */
  async prewarmDashboards(
    dashboards: string[] = [
      'dashboard1',
      'dashboard2',
      'dashboard3',
      'dashboard4',
      'dashboard5',
      'dashboard6',
    ],
    mode: 'live' | 'historic' | 'range' = 'live',
    start?: string,
    end?: string,
  ): Promise<void> {
    console.log(`🔥 Pre-warming ${dashboards.length} dashboards...`);

    try {
      await this.getMultipleDashboards(dashboards, mode, start, end);
      console.log('✅ All dashboards pre-warmed successfully');
    } catch (error) {
      console.error('❌ Error pre-warming dashboards:', error);
    }
  }

  /** -------------------
   * Individual Dashboard Configurations
   * ------------------- */

  // Dashboard 1 Metrics & Charts
  private DASH1_METRICS = {
    load: (doc: any) => this.formulas.calculateLoad(doc),
    rpm: (doc: any) => doc.Averagr_Engine_Speed || 0,
    runningHours: (doc: any) => this.formulas.calculateRunningHours(doc),
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

  // Dashboard 2 Charts
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
   * Metrics Mapping Functions (Optimized)
   * ------------------- */
  private mapMetrics(doc: any, definitions: any) {
    const metrics: Record<string, number> = {};
    for (const key in definitions) {
      const value = definitions[key](doc);
      metrics[key] = typeof value === 'number' ? +value.toFixed(2) : 0;
    }
    return metrics;
  }

  private mapMetricsDashboard2(doc: any): Record<string, number> {
    return {
      voltageL1: doc.Genset_L1L2_Voltage || 0,
      voltageL2: doc.Genset_L2L3_Voltage || 0,
      voltageL3: doc.Genset_L3L1_Voltage || 0,
      activePowerL1: doc.Genset_L1_Active_Power || 0,
      activePowerL2: doc.Genset_L2_Active_Power || 0,
      activePowerL3: doc.Genset_L3_Active_Power || 0,
      CurrentImbalance: this.formulas.calculateCurrentImbalance(doc),
      voltageImbalance: this.formulas.calculateVoltageImbalance(doc),
      powerLossFactor: this.formulas.calculatePowerLossFactor(doc),
      thermalStress: this.formulas.calculateThermalStress(doc),
    };
  }

  private mapMetricsDashboard3(doc: any) {
    return {
      intakeTemperature: doc.Intake_Manifold3_Temperature ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(doc),
      voltageImbalance: this.formulas.calculateVoltageImbalance(doc),
      coolingMarginF: this.formulas.calculateCoolingMarginF(doc),
      coolingMarginC: this.formulas.calculateCoolingMarginC(doc),
    };
  }

  private mapMetricsDashboard4(doc: any) {
    return {
      lubricationRiskIndex: this.formulas.calculateLubricationRiskIndex(doc),
      oilPressure: doc.Oil_Pressure ?? 0,
      engineSpeed: doc.Averagr_Engine_Speed ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
      biometricPressure: doc.Barometric_Absolute_Pressure ?? 0,
      loadPercent: this.formulas.calculateLoadPercent(doc),
    };
  }

  private mapMetricsDashboard5(doc: any) {
    return {
      fuelRate: doc.Fuel_Rate ?? 0,
      loadPercent: this.formulas.calculateLoadPercent(doc),
      airFuelEffectiveness: this.formulas.calculateAirFuelEffectiveness(doc),
      specificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(doc),
      heatRate: this.formulas.calculateHeatRate(doc),
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
    };
  }

  private mapMetricsDashboard6(doc: any) {
    return {
      totalFuelConsumption: doc.Total_Fuel_Consumption_calculated ?? 0,
      energyKWh: doc.Engine_Running_Time_calculated ?? 0,
      fuelConsumptionCurrentRun: doc.Total_Fuel_Consumption_calculated ?? 0,
    };
  }

  /** -------------------
   * Charts Mapping Functions (Optimized)
   * ------------------- */
  private mapCharts(data: any[], definitions: any) {
    const charts: Record<string, any[]> = {};

    for (const chartName in definitions) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        definitions[chartName].forEach((field: string) => {
          entry[field] = d[field] ?? null;
        });
        return entry;
      });
    }

    // Special charts
    charts.CurrentImbalanceNeutral = data.map((d) => ({
      time: d.timestamp,
      CurrentImbalance: this.formulas.calculateCurrentImbalance(d),
      neutralCurrent: this.formulas.calculateNeutralCurrent(d),
    }));

    charts.loadSharing = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;

      const total = IA + IB + IC || 1;
      return {
        time: d.timestamp,
        Genset_L1_Current: (IA / total) * 100,
        Genset_L2_Current: (IB / total) * 100,
        Genset_L3_Current: (IC / total) * 100,
        CurrentImbalance: this.formulas.calculateCurrentImbalance(d),
      };
    });

    return charts;
  }

  private mapChartsDashboard2(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.phaseBalanceEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_L1_Current: d.Genset_L1_Current ?? 0,
      Genset_L2_Current: d.Genset_L2_Current ?? 0,
      Genset_L3_Current: d.Genset_L3_Current ?? 0,
    }));

    charts.voltageQualitySymmetry = data.map((d) => ({
      time: d.timestamp,
      Genset_L1L2_Voltage: d.Genset_L1L2_Voltage ?? 0,
      Genset_L2L3_Voltage: d.Genset_L2L3_Voltage ?? 0,
      Genset_L3L1_Voltage: d.Genset_L3L1_Voltage ?? 0,
      voltageImbalance: this.formulas.calculateVoltageImbalance(d),
      Genset_LL_Avg_Voltage: this.formulas.calculateAvgLLVoltage(d),
    }));

    charts.electroMechanicalStress = data.map((d) => ({
      time: d.timestamp,
      LoadPercent: this.formulas.calculateLoadPercent(d),
      PowerLossFactor: this.formulas.calculatePowerLossFactor(d),
    }));

    charts.lossesThermalStress = data.map((d) => ({
      time: d.timestamp,
      PowerLossFactor: this.formulas.calculatePowerLossFactor(d),
      I2: this.formulas.calculateThermalStress(d),
    }));

    charts.frequencyRegulationEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_Frequency_OP_calculated: d.Genset_Frequency_OP_calculated ?? 0,
      Frequency_Deviation_Rad: d.Frequency_Deviation_Rad ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard3(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.intakeBoost = data.map((d) => ({
      time: d.timestamp,
      Intake_Manifold3_Temperature: d.Intake_Manifold3_Temperature ?? 0,
      Boost_Pressure: d.Boost_Pressure ?? 0,
    }));

    charts.thermalStress = data.map((d) => ({
      time: d.timestamp,
      thermalStressF: this.formulas.calculateThermalStressF(d),
      thermalStressC: this.formulas.calculateThermalStressC(d),
      OTSRF: this.formulas.calculateOTSRF(d),
      OTSRC: this.formulas.calculateOTSRC(d),
    }));

    charts.coolingMargin = data.map((d) => ({
      time: d.timestamp,
      Cooling_MarginF: this.formulas.calculateCoolingMarginF(d),
      Cooling_MarginC: this.formulas.calculateCoolingMarginC(d),
    }));

    charts.voltageImbalanceChart = data.map((d) => ({
      time: d.timestamp,
      avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(d),
      voltageImbalance: this.formulas.calculateVoltageImbalance(d),
    }));

    return charts;
  }

  private mapChartsDashboard4(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.lubricationRiskIndex = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? 0,
      Oil_Temperature: d.Oil_Temperature ?? 0,
      Lubrication_Risk_Index: this.formulas.calculateLubricationRiskIndex(d),
    }));

    charts.oilPressureEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? 0,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? 0,
    }));

    charts.boostFuelOutlet = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? 0,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated ?? 0,
    }));

    charts.boostLoad = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? 0,
      LoadPercent: this.formulas.calculateLoadPercent(d),
    }));

    charts.fuelOutletBiometric = data.map((d) => ({
      time: d.timestamp,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated ?? 0,
      Barometric_Absolute_Pressure: d.Barometric_Absolute_Pressure ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard5(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.fuelRateLoad = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      LoadPercent: this.formulas.calculateLoadPercent(d),
    }));

    charts.airFuelEffectiveness = data.map((d) => ({
      time: d.timestamp,
      AirFuelEffectiveness: this.formulas.calculateAirFuelEffectiveness(d),
    }));

    charts.specificFuelConsumption = data.map((d) => ({
      time: d.timestamp,
      SpecificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(d),
    }));

    charts.heatRate = data.map((d) => ({
      time: d.timestamp,
      HeatRate: this.formulas.calculateHeatRate(d),
    }));

    charts.fuelFlowRateChange = data.map((d, i) => ({
      time: d.timestamp,
      FuelFlowRateChange: this.formulas.calculateFuelFlowRateChange(
        d,
        i > 0 ? data[i - 1] : null,
      ),
    }));

    charts.fuelRateOutlet = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      Fuel_Outlet_Pressure: d.Fuel_Outlet_Pressure_calculated ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard6(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.engineTorqueVsRunningTime = data.map((d) => ({
      time: d.timestamp,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
      Engine_Running_Time_calculated: d.Engine_Running_Time_calculated ?? 0,
    }));

    charts.fuelRateVsTorque = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
    }));

    charts.torqueResponseLoad = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d),
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
    }));

    charts.averageEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? 0,
    }));

    charts.loadPercent = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d),
    }));

    charts.mechanicalStress = data.map((d) => ({
      time: d.timestamp,
      Mechanical_Stress: this.formulas.calculateMechanicalStress(d),
    }));

    charts.gensetPowerFactor = data.map((d) => ({
      time: d.timestamp,
      Genset_Total_kW: d.Genset_Total_kW ?? 0,
    }));

    // Use FormulasService for complex calculations
    charts.rpmStabilityIndex =
      this.formulas.calculateRPMStabilityWithLoad(data);
    charts.oscillationIndex = this.formulas.calculateOscillationIndex(data);
    charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);

    return charts;
  }
}
