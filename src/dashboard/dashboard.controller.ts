/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Post } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardDto } from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly DashboardService: DashboardService) {}

  @Post('dashboard-data')
  async getDashoardDataChart1(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart1(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data2')
  async getDashoardDataChart2(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart2(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data3')
  async getDashoardDataChart3(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart3(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data4')
  async getDashoardDataChart4(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart4(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data5')
  async getDashoardDataChart5(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart5(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data6')
  async getDashoardDataChart6(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart6(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data7')
  async getDashoardDataChart7(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart7(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data8')
  async getDashoardData8(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart8(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data9')
  async getDashoardDataChart9(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart9(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data10')
  async getDashoardDataChart10(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart10(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data11')
  async getDashoardDataChart11(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart11(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data12')
  async getDashoardDataChart12(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart12(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data13')
  async getDashoardDataChart13(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart13(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data14')
  async getDashoardDataChart14(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart14(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data15')
  async getDashoardDataChart15(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart15(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data16')
  async getDashoardDataChart16(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart16(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data17')
  async getDashoardDataChart17(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart17(dto);
    return { message: 'Dashoard Data', data };
  }
  @Post('dashboard-data18')
  async getDashoardDataChart18(@Body() dto: DashboardDto) {
    const data = await this.DashboardService.getDashboardDataChart18(dto);
    return { message: 'Dashoard Data', data };
  }
}
