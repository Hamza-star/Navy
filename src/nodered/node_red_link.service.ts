import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class NodeRedLinkService {
  constructor(private readonly httpService: HttpService) {}

  async fetchNodeRedData(): Promise<any> {
    try {
      const response = await this.httpService.axiosRef.get(
        'http://13.234.241.103:1880/ifl_realtime',
      );
      const data = response.data;

      // Example: Calculate new fields
      // Replace these formulas with your actual logic
      data.range1_3851 =
        (data.r_Cooling_Water_Supply_Header_3851_TI_71_Scaled || 0) -
        (data.r_Cooling_Water_Supply_Header_3851_TI_41_Scaled || 0);
      data.range2_3851 =
        (data.r_Cooling_Water_Supply_Header_3851_TI_81_Scaled || 0) -
        (data.r_Cooling_Water_Supply_Header_3851_TI_72_Scaled || 0);
      data.approach1_3851 = '?';
      data.approach2_3851 = '?';
      data.range1_4101 =
        (data.r_Cooling_Water_Supply_Header_4101_TI_44_Scaled || 0) -
        (data.r_Cooling_Water_Supply_Header_4101_TI_41_Scaled || 0);
      data.range2_4101 =
        (data.r_Cooling_Water_Supply_Header_4101_TI_54_Scaled || 0) -
        (data.r_Cooling_Water_Supply_Header_4101_TI_51_Scaled || 0);
      data.approach1_4101 = '?';
      data.approach2_4101 = '?';
      (data.UI_51_51 = 'NotConnected'),
        (data.UI_01_xx = 'NotConnected'),
        (data.TIC_51_71_percent = ((data.r_Inverter3_Speed_3851_E07_Q01_Scaled || 0) / 1350) * 100);
      data.TIC_51_71_sp = 'Formula';
      data.TIC_51_81_percent = ((data.r_Inverter4_Speed_3851_E08_Q01_Scaled || 0) / 1350) * 100;
      data.TIC_51_81_sp = 'Formula';
      data.TIC_01_47_percent = ((data.r_Inverter1_Speed_4101_E05_Q01_Scaled || 0) / 1350) * 100;
      data.TIC_01_47_sp = 'Formula';
      data.TIC_01_57_percent = ((data.r_Inverter2_Speed_4101_E06_Q01_Scaled || 0) / 1350) * 100;
      data.TIC_01_57_sp = 'Formula';

      return data;
    } catch (error) {
      throw new HttpException('Unable to fetch data from Node-RED', 500);
    }
  }
}
