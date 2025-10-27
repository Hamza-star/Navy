/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/trends/prewarm.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { TrendsService } from './trends.service';

@Injectable()
export class PrewarmService implements OnModuleInit {
  constructor(private readonly trendsService: TrendsService) {}

  async onModuleInit() {
    console.log('🚀 Prewarming cache...');

    // Define prewarm scenarios
    const prewarmConfigs = [
      {
        mode: 'range',
        startDate: '2025-10-01T00:00:00.000Z',
        endDate: '2025-10-05T00:00:00.000Z',
        params: [
          'Genset_LN_Avg_Voltage',
          'Oil_Pressure',
          'Fuel_Rate',
          'Genset_Total_kW',
          'RPM_Stability_Index',
          'Heat_Rate',
        ],
      },
      {
        mode: 'historic',
        startDate: '2025-10-03T00:00:00.000Z',
        endDate: '2025-10-04T00:00:00.000Z',
        params: ['Genset_L1_Current', 'Coolant_Temperature'],
      },
    ];

    // Run all prewarm jobs in parallel
    await Promise.all(
      prewarmConfigs.map(async (config) => {
        try {
          const start = Date.now();
          await this.trendsService.getTrends(config);
          console.log(
            `✅ Cache prewarmed for ${config.mode} in ${Date.now() - start} ms`,
          );
        } catch (err) {
          console.error(`❌ Failed prewarm for ${config.mode}:`, err.message);
        }
      }),
    );

    console.log('🔥 All prewarm jobs done — ready for instant responses!');
  }
}
