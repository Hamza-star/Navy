// src/meter_data/meter_data.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class meter_dataService {
  constructor(private readonly httpService: HttpService) {}

  private readonly url = 'http://13.234.241.103:1880/ifl_realtime';

  private getMeterPrefixes(area: string, U_selections: string): string[] {
    const mapping: Record<string, Record<string, string[]>> = {
      Chillers: {
        U_5: ['U_5'],
        U_6: ['U_6'],
      },
      Process: {
        U_7: ['U_7'],
        U_8: ['U_8'],
      },
    };

    return mapping?.[area]?.[U_selections] || [];
  }

  async getFilteredData(area: string, U_selections: string): Promise<any> {
    const response = await firstValueFrom(this.httpService.get(this.url));
    const data = response.data;

    // Get allowed meter prefixes for the selected area and U
    const allowedMeterIds = this.getMeterPrefixes(area, U_selections);
    if (allowedMeterIds.length === 0) {
      throw new Error(
        `Invalid area "${area}" or U_selection "${U_selections}"`,
      );
    }

    // Extract all fields that start with the allowed meterId(s)
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedMeterIds.some((prefix) => key.startsWith(prefix))) {
        filtered[key] = value;
      }
    }

    return filtered;
  }
}
