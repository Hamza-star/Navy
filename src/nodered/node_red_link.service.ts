/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
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
      const WET_BULB = 25;
      const Fixed_Value = 1350; 
      // Example: Calculate new fields
      // Replace these formulas with your actual logic
      console.log(data.CHCT1_TEMP_RTD_02_AI)
      console.log(data.CHCT1_TEMP_RTD_01_AI)
      console.log(data.CT1_TEMP_RTD_02_AI)
      console.log(data.CT1_TEMP_RTD_01_AI)
      data.CHCT1_RANGE =
        (data.CHCT1_TEMP_RTD_02_AI || 0) -
        (data.CHCT1_TEMP_RTD_01_AI || 0);
        console.log(data.CHCT1_RANGE)
      data.CHCT2_RANGE =
        (data.CHCT2_TEMP_RTD_02_AI || 0) -
        (data.CHCT2_TEMP_RTD_01_AI || 0);
      console.log(data.CHCT2_RANGE)
      data.CHCT1_APPROACH = (data.CHCT1_TEMP_RTD_01_AI)-WET_BULB;
      data.CHCT2_APPROACH = (data.CHCT2_TEMP_RTD_01_AI)-WET_BULB;
      console.log(data.CHCT1_APPROACH)
      console.log(data.CHCT2_APPROACH)
      data.CT1_RANGE =
        (data.CT1_TEMP_RTD_02_AI || 0) -
        (data.CT1_TEMP_RTD_01_AI || 0);
        console.log(data.CT1_RANGE)
      data.CT2_RANGE =
        (data.CT2_TEMP_RTD_02_AI || 0) -
        (data.CT2_TEMP_RTD_01_AI || 0);
      console.log(data.CT2_RANGE)
      data.CT1_APPROACH = (data.CT1_TEMP_RTD_01_AI)-WET_BULB;
      console.log(data.CT1_APPROACH);
      data.CT2_APPROACH = (data.CT2_TEMP_RTD_01_AI)-WET_BULB;
       console.log(data.CT1_APPROACH);
     
       (data.UI_51_51 = 'NotConnected'),
        (data.UI_01_xx = 'NotConnected'),
        (data.TIC_51_71_percent =
          ((data.CHCT1_INV_01_SPD_AI || 0) / Fixed_Value) * 100);
      data.TIC_51_71_sp = (data.CHCT1_TEMP_RTD_02_AI)-(data.CHCT1_RANGE);
      data.TIC_51_81_percent =
        ((data.CHCT2_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_51_81_sp = (data.CHCT2_TEMP_RTD_02_AI)-(data.CHCT2_RANGE);
      data.TIC_01_47_percent =
        ((data.CT1_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_01_47_sp = (data.CT1_TEMP_RTD_02_AI)-(data.CT1_RANGE);
      data.TIC_01_57_percent =
        ((data.CT2_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_01_57_sp = (data.CT2_TEMP_RTD_02_AI)-(data.CT2_RANGE);

      return data;
    } catch (error) {
      throw new HttpException('Unable to fetch data from Node-RED', 5001);
    }
  }
}
