import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogsQueryDto } from './dto/logs-query.dto';
import * as moment from 'moment-timezone';
import { LogEntry } from './schemas/logs.schema';

@Injectable()
export class LogsDataService {
  private readonly tagGroups = {
    voltage: [
      'Voltage_AN_V',
      'Voltage_BN_V',
      'Voltage_CN_V',
      'Voltage_LN_V',
    ],
    current: [
      'Current_AN_Amp',
      'Current_BN_Amp',
      'Current_CN_Amp',
      'Current_Total_Amp',
    ],
    power_factor: [
      'PowerFactor_A',
      'PowerFactor_B',
      'PowerFactor_C',
      'PowerFactor_Total',
    ],
    active_power: ['ActivePower_Total_kW'],
    reactive_power: ['ReactivePower_Total_kVAR'],
    reactive_energy: ['ReactiveEnergy_Total_kVARh'],
    apparent_power: ['ApparentPower_Total_kVA'],
    harmonics: [
      'Harmonics_V1_THD',
      'Harmonics_V2_THD',
      'Harmonics_V3_THD',
      'Harmonics_I1_THD',
      'Harmonics_I2_THD',
      'Harmonics_I3_THD',
    ],
    active_energy: ['ActiveEnergy_Total_Delivered_kWh'],
  };

  constructor(
    @InjectModel('LogEntry') private readonly logEntryModel: Model<LogEntry>,
  ) {}

  async fetchLogs(query: LogsQueryDto) {
    const { type, meters, start_date, end_date } = query;

    console.log('Received query:', query);

    const baseTags = this.tagGroups[type];
    console.log('Base tags:', baseTags);

    if (!baseTags) {
      console.log('Invalid type specified:', type);
      return { success: false, message: 'Invalid type specified.' };
    }

    const meterIds = meters.split(',').map((m) => m.trim());
    console.log('Meter IDs:', meterIds);

    const startUTC = moment
      .tz(start_date, 'Asia/Karachi')
      .startOf('day')
      .utc()
      .toDate();

    const endUTC = moment
      .tz(end_date, 'Asia/Karachi')
      .endOf('day')
      .utc()
      .toDate();

    const dbQuery = {
      timestamp: {
        $gte: startUTC,
        $lte: endUTC,
      },
    };

    console.log('MongoDB query:', dbQuery);

    const data = await this.logEntryModel.find(dbQuery).lean().exec();
    console.log(`Fetched ${data.length} records`);
    if (data.length > 0) {
      console.log('Sample record:', data[0]);
    }

    const results: any[] = [];

    for (const item of data) {
      for (const meterId of meterIds) {
        const entry: any = {
          time: item.timestamp
            ? moment(item.timestamp)
                .tz('Asia/Karachi')
                .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
            : null,
          meterId,
        };

        for (const tag of baseTags) {
          const field = `${meterId}_${tag}`;
          console.log('Checking field:', field, 'Value:', item[field]);
          if (item[field] !== undefined) {
            entry[tag] = item[field];
          }
        }

        if (Object.keys(entry).length > 2) {
          console.log('Pushing entry:', entry);
          results.push(entry);
        }
      }
    }

    console.log('Final results:', results);

    return { success: true, data: results };
  }
}
