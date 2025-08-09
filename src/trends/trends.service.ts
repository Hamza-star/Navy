// src/trends/trends.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { trendsData } from './schemas/trends.schema';

@Injectable()
export class TrendsService {
  constructor(
    @InjectModel(trendsData.name)
    private readonly trendsModel: Model<trendsData>,
  ) {}

  private getMeterPrefixes(area: string, LT_selections: string): string[] {
    const mapping = {
      Process: {
        CT1: ['CT1_'],
        CT2: ['CT2_'],
        ALL: ['CT1_', 'CT2_'],
      },
      Chiller: {
        CHCT1: ['CHCT1_'],
        CHCT2: ['CHCT2_'],
        ALL: ['CHCT1_', 'CHCT2_'],
      },
    };

    // Handle ALL areas
    if (area === 'ALL') {
      if (LT_selections === 'ALL') {
        // Merge ALL from both Process and Chiller
        return [...mapping.Process.ALL, ...mapping.Chiller.ALL];
      } else {
        // Merge specific LT selection from both areas (if exists)
        const fromProcess = mapping.Process[LT_selections] || [];
        const fromChiller = mapping.Chiller[LT_selections] || [];
        return [...fromProcess, ...fromChiller];
      }
    }

    // Handle single area normally
    return mapping[area]?.[LT_selections] || [];
  }
  private meterSuffixMapping(): Record<string, string[]> {
    return {
      FM_01: ['FR', 'TOT'],
      FM_02: ['FR', 'TOT'],
      TEMP_RTD_01: ['AI'],
      TEMP_RTD_02: ['AI'],
      PT_01: ['AI'],
      INV_01_SPD: ['AI'],
      LLS_01: ['DI'],
      LS_01: ['DI'],
      VS_FAN_01: ['DI'],
      EM01: [
        'Voltage_AN_V',
        'Voltage_BN_V',
        'Voltage_CN_V',
        'Voltage_LN_V',
        'Voltage_AB_V',
        'Voltage_BC_V',
        'Voltage_CA_V',
        'Voltage_LL_V',
        'Current_AN_Amp',
        'Current_BN_Amp',
        'Current_CN_Amp',
        'Current_Total_Amp',
        'Frequency_Hz',
        'ActivePower_A_kW',
        'ActivePower_B_kW',
        'ActivePower_C_kW',
        'ActivePower_Total_kW',
        'ReactivePower_A_kVAR',
        'ReactivePower_B_kVAR',
        'ReactivePower_C_kVAR',
        'ReactivePower_Total_kVAR',
        'ApparentPower_A_kVA',
        'ApparentPower_B_kVA',
        'ApparentPower_C_kVA',
        'ApparentPower_Total_kVA',
        'ActiveEnergy_A_kWh',
        'ActiveEnergy_B_kWh',
        'ActiveEnergy_C_kWh',
        'ActiveEnergy_Total_kWh',
        'ActiveEnergy_A_Received_kWh',
        'ActiveEnergy_B_Received_kWh',
        'ActiveEnergy_C_Received_kWh',
        'ActiveEnergy_Total_Received_kWh',
        'ActiveEnergy_A_Delivered_kWh',
        'ActiveEnergy_B_Delivered_kWh',
        'ActiveEnergy_C_Delivered_kWh',
        'ActiveEnergy_Total_Delivered_kWh',
        'ApparentEnergy_A_kVAh',
        'ApparentEnergy_B_kVAh',
        'ApparentEnergy_C_kVAh',
        'ApparentEnergy_Total_kVAh',
        'ReactiveEnergy_A_kVARh',
        'ReactiveEnergy_B_kVARh',
        'ReactiveEnergy_C_kVARh',
        'ReactiveEnergy_Total_kVARh',
        'ReactiveEnergy_A_Inductive_kVARh',
        'ReactiveEnergy_B_Inductive_kVARh',
        'ReactiveEnergy_C_Inductive_kVARh',
        'ReactiveEnergy_Total_Inductive_kVARh',
        'ReactiveEnergy_A_Capacitive_kVARh',
        'ReactiveEnergy_B_Capacitive_kVARh',
        'ReactiveEnergy_C_Capacitive_kVARh',
        'ReactiveEnergy_Total_Capacitive_kVARh',
        'Harmonics_V1_THD',
        'Harmonics_V2_THD',
        'Harmonics_V3_THD',
        'Harmonics_I1_THD',
        'Harmonics_I2_THD',
        'Harmonics_I3_THD',
        'PowerFactor_A',
        'PowerFactor_B',
        'PowerFactor_C',
        'PowerFactor_Total',
      ],
      // Add more here as needed...
    };
  }

  async TrendsDropdownList() {
    const mapping = this.meterSuffixMapping();

    // Create dropdown-friendly format
    return Object.keys(mapping).map((meterId) => ({
      meterId,
      suffixes: mapping[meterId],
    }));
  }
  async getTrendData(
    startDate: string,
    endDate: string,
    meterIds: string[],
    suffixes: string[],
    area: string,
    LT_selections: string,
  ) {
    const start = `${startDate}T00:00:00.000+05:00`;
    const end = `${endDate}T23:59:59.999+05:00`;

    console.log('==== Trend Data Query Debug ====');
    console.log('Start Date (ISO):', start);
    console.log('End Date (ISO):', end);
    console.log('Meter IDs (raw):', meterIds);
    console.log('Suffixes:', suffixes);
    console.log('Area:', area);
    console.log('LT Selection:', LT_selections);

    const allowedPrefixes = this.getMeterPrefixes(area, LT_selections);
    console.log('Allowed Prefixes:', allowedPrefixes);

    // If multiple prefixes exist (e.g., ALL), we will generate combinations
    const fullMeterIds: string[] = [];
    allowedPrefixes.forEach((prefix) => {
      meterIds.forEach((id) => {
        fullMeterIds.push(`${prefix}${id}`);
      });
    });

    console.log('Full Meter IDs (with prefix):', fullMeterIds);

    const projection: Record<string, 1> = { timestamp: 1 };
    const validFields: string[] = [];

    fullMeterIds.forEach((meterId) => {
      if (!suffixes || suffixes.length === 0) {
        projection[meterId] = 1;
        validFields.push(meterId);
        console.log('Added (no suffix mode):', meterId);
      } else {
        suffixes.forEach((suffix) => {
          const fieldName = meterId.endsWith(`_${suffix}`)
            ? meterId
            : `${meterId}${suffix.startsWith('_') ? suffix : `_${suffix}`}`;
          projection[fieldName] = 1;
          validFields.push(fieldName);
          console.log('Added (suffix mode):', fieldName);
        });
      }
    });

    console.log('Final Projection:', projection);
    console.log('Valid Fields for Query:', validFields);

    if (validFields.length === 0) {
      console.warn('⚠ No valid fields found — returning empty array.');
      return [];
    }

    console.log('Executing Mongo Query...');
    const rawData = await this.trendsModel
      .find({ timestamp: { $gte: start, $lte: end } }, projection)
      .lean();

    console.log(`Mongo returned ${rawData.length} records`);

    const formatted = rawData.map((doc, idx) => {
      const flat: Record<string, any> = { timestamp: doc.timestamp };
      validFields.forEach((field) => {
        const value = doc[field];
        flat[field] =
          typeof value === 'number' && Math.abs(value) < 0.001
            ? 0
            : (value ?? 0);
      });
      console.log(`Record ${idx + 1}:`, flat);
      return flat;
    });

    console.log('==== Query Debug Complete ====');
    return formatted.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}
