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
      const Fixed_Value = 1450;
      data.CHCT1_RANGE =
        (data.CHCT1_TEMP_RTD_02_AI || 0) - (data.CHCT1_TEMP_RTD_01_AI || 0);
      data.CHCT2_RANGE =
        (data.CHCT2_TEMP_RTD_02_AI || 0) - (data.CHCT2_TEMP_RTD_01_AI || 0);
      data.CHCT1_APPROACH = data.CHCT1_TEMP_RTD_01_AI - WET_BULB;
      data.CHCT2_APPROACH = data.CHCT2_TEMP_RTD_01_AI - WET_BULB;
      data.CT1_RANGE =
        (data.CT1_TEMP_RTD_02_AI || 0) - (data.CT1_TEMP_RTD_01_AI || 0);
      data.CT2_RANGE =
        (data.CT2_TEMP_RTD_02_AI || 0) - (data.CT2_TEMP_RTD_01_AI || 0);
      data.CT1_APPROACH = data.CT1_TEMP_RTD_01_AI - WET_BULB;
      data.CT2_APPROACH = data.CT2_TEMP_RTD_01_AI - WET_BULB;

      (data.UI_51_51 = 'NotConnected'),
        (data.UI_01_xx = 'NotConnected'),
        (data.TIC_51_71_percent =
          ((data.CHCT1_INV_01_SPD_AI || 0) / Fixed_Value) * 100);
      data.TIC_51_71_sp = data.CHCT1_TEMP_RTD_02_AI - data.CHCT1_RANGE;
      data.TIC_51_81_percent =
        ((data.CHCT2_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_51_81_sp = data.CHCT2_TEMP_RTD_02_AI - data.CHCT2_RANGE;
      data.TIC_01_47_percent =
        ((data.CT1_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_01_47_sp = data.CT1_TEMP_RTD_02_AI - data.CT1_RANGE;
      data.TIC_01_57_percent =
        ((data.CT2_INV_01_SPD_AI || 0) / Fixed_Value) * 100;
      data.TIC_01_57_sp = data.CT2_TEMP_RTD_02_AI - data.CT2_RANGE;
      data.CHCT1_EM01_CURRENT_AVERAGE_AMP =
        (data.CHCT1_EM01_Current_AN_Amp +
          data.CHCT1_EM01_Current_BN_Amp +
          data.CHCT1_EM01_Current_CN_Amp) /
        3;

      data.CHCT2_EM01_CURRENT_AVERAGE_AMP =
        (data.CHCT2_EM01_Current_AN_Amp +
          data.CHCT2_EM01_Current_BN_Amp +
          data.CHCT2_EM01_Current_CN_Amp) /
        3;

      data.CT1_EM01_CURRENT_AVERAGE_AMP =
        (data.CT1_EM01_Current_AN_Amp +
          data.CT1_EM01_Current_BN_Amp +
          data.CT1_EM01_Current_CN_Amp) /
        3;

      data.CT2_EM01_CURRENT_AVERAGE_AMP =
        (data.CT2_EM01_Current_AN_Amp +
          data.CT2_EM01_Current_BN_Amp +
          data.CT2_EM01_Current_CN_Amp) /
        3;

      return data;
    } catch (error) {
      throw new HttpException('Unable to fetch data from Node-RED', 5001);
    }
  }
}
