/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // dashboard.controller.ts
  @Post('dashboard-data')
  async getDashboardDataChart1(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?:
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear';
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart1(serviceDto);
  }

  @Post('dashboard-data2')
  async getDashoardDataChart2(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart2(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data3')
  async getDashoardDataChart3(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart3(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data4')
  async getDashoardDataChart4(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart4(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data5')
  async getDashoardDataChart5(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart5(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data6')
  async getDashoardDataChart6(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart6(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data7')
  async getDashboardDataChart7(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?:
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear';
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    return this.dashboardService.getDashboardDataChart7(dto);
  }

  @Post('dashboard-data8')
  async getDashboardDataChart8(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
      towerType: dto.towerType === 'all' ? undefined : dto.towerType,
    };

    return this.dashboardService.getDashboardDataChart8(serviceDto);
  }
  @Post('dashboard-data9')
  async getDashboardDataChart9(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart9(serviceDto);
  }
  @Post('dashboard-data10')
  async getDashboardDataChart10(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart10(serviceDto);
  }
  @Post('dashboard-data11')
  async getDashboardDataChart11(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart11(serviceDto);
  }
  @Post('dashboard-data12')
  async getDashboardDataChart12(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart12(serviceDto);
  }
  @Post('dashboard-data13')
  async getDashboardDataChart13(
    @Body()
    dto: {
      fromDate?: string;
      toDate?: string;
      date?: string;
      range?: string;
      interval?: '15min' | 'hour' | 'day' | 'month';
      towerType?: 'CHCT' | 'CT' | 'all' | 'CT1' | 'CT2' | 'CHCT1' | 'CHCT2';
      startTime?: string;
      endTime?: string;
    },
  ) {
    const serviceDto = {
      ...dto,
      range: dto.range as
        | 'today'
        | 'yesterday'
        | 'week'
        | 'lastWeek'
        | 'month'
        | 'lastMonth'
        | 'year'
        | 'lastYear'
        | undefined,
    };

    return this.dashboardService.getDashboardDataChart13(serviceDto);
  }
  @Post('dashboard-data14')
  async getDashoardDataChart14(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart14(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data15')
  async getDashoardDataChart15(@Body() dto: DashboardDto) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart15(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data16')
  async getDashoardDataChart16(@Body() dto: any) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart16(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data17')
  async getDashoardDataChart17(@Body() dto: any) {
    console.log('Received DashboardDto:', dto);
    const data = await this.dashboardService.getDashboardDataChart17(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data18')
  async getChart18(
    @Body()
    dto: {
      date?: string;
      range?: string;
      fromDate?: string;
      toDate?: string;
      startTime?: string;
      endTime?: string;
      towerType?: 'CHCT' | 'CT' | 'all';
      interval?: '15min' | 'hour' | 'day' | 'month';
    },
  ) {
    return this.dashboardService.getDashboardDataChart18(dto);
  }

  @Post('dashboard-data19')
  async getChart19(
    @Body()
    dto: {
      date?: string;
      range?: string;
      fromDate?: string;
      toDate?: string;
      startTime?: string;
      endTime?: string;
      towerType?: 'CHCT' | 'CT' | 'all';
      interval?: 'hour' | '15min';
    },
  ) {
    const result = await this.dashboardService.getDashboardDataChart19(dto);
    return result;
  }
}
