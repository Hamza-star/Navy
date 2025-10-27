/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Injectable()
export class PrewarmDashboardService implements OnModuleInit, OnModuleDestroy {
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(private readonly dashboardService: DashboardService) {}

  async onModuleInit() {
    console.log('🚀 Starting dashboard cache prewarm...');
    await this.runPrewarm();

    // ♻️ Auto-refresh every 10 minutes (you can change it)
    this.refreshInterval = setInterval(
      () => {
        this.runPrewarm().catch((err) =>
          console.error('⚠️ Dashboard prewarm failed:', err.message),
        );
      },
      10 * 60 * 1000,
    ); // 10 minutes
  }

  onModuleDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private async runPrewarm() {
    const start = Date.now();
    await this.dashboardService.prewarmAllDashboards();
    console.log(`✅ Dashboard prewarm completed in ${Date.now() - start} ms`);
  }
}
