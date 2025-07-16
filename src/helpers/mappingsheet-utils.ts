import { Injectable } from '@nestjs/common';

@Injectable()
export class MappingSheetService {
  private readonly mapping: Record<string, string[]> = {
    '3851_E07': [
      'r_Cooling_Tower_Makeup_3851_FQI_71_Scaled',
      'r_Inverter1_Speed_3851_E07_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_44_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_71_Scaled', /// This Tag will be updated. With new format ta name.
      'Cooling_Tower3_Level',
      'GearBox_Oil_Level_Fan03',
      'Cooling_Tower3_Vibration_Switch',
    ],
    '3851_E08': [
      'r_Cooling_Tower_Makeup_3851_FQI_81_Scaled',
      'r_Inverter1_Speed_3851_E08_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_72_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_81_Scaled',
      'Cooling_Tower4_Level',
      'GearBox_Oil_Level_Fan04',
      'Cooling_Tower4_Vibration_Switch',
    ],
    '4101_E05': [
      'r_Cooling_Tower_Makeup_4101_FQI_05_Scaled',
      'r_Inverter1_Speed_4101_E05_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_41_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_44_Scaled',
      'Cooling_Tower1_Level',
      'GearBox_Oil_Level_Fan01',
      'Cooling_Tower1_Vibration_Switch',
    ],
    '4101_E06': [
      'r_Cooling_Tower_Makeup_4101_FQI_06_Scaled',
      'r_Inverter1_Speed_4101_E06_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_51_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_54_Scaled',
      'Cooling_Tower2_Level',
      'GearBox_Oil_Level_Fan02',
      'Cooling_Tower2_Vibration_Switch',
    ],
    '3851': [
      'r_Cooling_Tower_Makeup_3851_FQI_71_Scaled',
      'r_Inverter1_Speed_3851_E07_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_44_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_71_Scaled	',
      'Cooling_Tower3_Level',
      'GearBox_Oil_Level_Fan03',
      'Cooling_Tower3_Vibration_Switch',
      'r_Cooling_Tower_Makeup_3851_FQI_81_Scaled',
      'r_Inverter1_Speed_3851_E08_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_72_Scaled',
      'r_Cooling_Water_Supply_Header_3851_TI_81_Scaled	',
      'Cooling_Tower4_Level',
      'GearBox_Oil_Level_Fan04',
      'Cooling_Tower4_Vibration_Switch',
      'r_Pressure_3851_PI_78_Scaled',
    ],
    '4101': [
      'r_Cooling_Tower_Makeup_4101_FQI_05_Scaled',
      'r_Inverter1_Speed_4101_E05_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_41_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_44_Scaled	',
      'Cooling_Tower1_Level',
      'GearBox_Oil_Level_Fan01',
      'Cooling_Tower1_Vibration_Switch',
      'r_Cooling_Tower_Makeup_4101_FQI_06_Scaled',
      'r_Inverter1_Speed_4101_E06_Q01_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_51_Scaled',
      'r_Cooling_Water_Supply_Header_4101_TI_54_Scaled	',
      'Cooling_Tower2_Level',
      'GearBox_Oil_Level_Fan02',
      'Cooling_Tower2_Vibration_Switch',
      'r_Pressure_4101_PI_56_Scaled',
    ],
  };

  resolve(tower: string): string[] {
    return this.mapping[tower] || [tower];
  }
}
