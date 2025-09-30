import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogsQueryDto } from './dto/logs-query.dto';
import * as moment from 'moment-timezone';
import { LogEntry } from './schemas/logs.schema';

@Injectable()
export class LogsDataService {
  private readonly tagGroups = {
    voltage: ['Voltage_AN_V', 'Voltage_BN_V', 'Voltage_CN_V', 'Voltage_LN_V'],
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

  // async fetchLogs(query: LogsQueryDto) {
  //   const { type, meters, start_date, end_date } = query;

  //   const baseTags = this.tagGroups[type];
  //   if (!baseTags) {
  //     return { success: false, message: 'Invalid type specified.' };
  //   }

  //   const meterIds = meters.split(',').map((m) => m.trim());

  //   // Format start and end date as strings matching your DB format with milliseconds and Z
  //   const startStr = moment(start_date)
  //     .startOf('day')
  //     .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
  //   const endStr = moment(end_date)
  //     .endOf('day')
  //     .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

  //   // Query for string timestamps
  //   const dbQuery = {
  //     timestamp: {
  //       $gte: startStr,
  //       $lte: endStr,
  //     },
  //   };

  //   const data = await this.logEntryModel.find(dbQuery).lean().exec();

  //   const results: any[] = [];

  //   for (const item of data) {
  //     for (const meterId of meterIds) {
  //       const entry: any = {
  //         time: item.timestamp
  //           ? moment(item.timestamp)
  //               .tz('Asia/Karachi')
  //               .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
  //           : null,
  //         meterId,
  //       };

  //       for (const tag of baseTags) {
  //         const field = `${meterId}_EM01_${tag}`;
  //         if (item[field] !== undefined) {
  //           entry[tag] = item[field];
  //         }
  //       }

  //       if (Object.keys(entry).length > 2) {
  //         results.push(entry);
  //       }
  //     }
  //   }

  //   return { success: true, data: results };
  // }

  // async fetchLogs(query: LogsQueryDto) {
  //   const { type, meters, start_date, end_date } = query;

  //   const baseTags = this.tagGroups[type];
  //   if (!baseTags) {
  //     return { success: false, message: 'Invalid type specified.' };
  //   }

  //   const meterIds = meters.split(',').map((m) => m.trim());

  //   const startStr = moment(start_date)
  //     .startOf('day')
  //     .add(6, 'hours') // 06:00:00.000
  //     .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

  //   const endStr = moment(end_date)
  //     .startOf('day')
  //     .add(30, 'hours') // agle din 06:00:00.000
  //     .add(59, 'seconds') // 06:00:59.000 tak extend
  //     .add(999, 'milliseconds') // 06:00:59.999 tak extend
  //     .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

  //   const dbQuery = {
  //     timestamp: {
  //       $gte: startStr,
  //       $lte: endStr,
  //     },
  //   };

  //   const data = await this.logEntryModel.find(dbQuery).lean().exec();

  //   const results: any[] = [];

  //   for (const item of data) {
  //     for (const meterId of meterIds) {
  //       const entry: any = {
  //         time: item.timestamp
  //           ? moment(item.timestamp)
  //               .tz('Asia/Karachi')
  //               .format('YYYY-MM-DDTHH:mm:ss.SSSZ')
  //           : null,
  //         meterId,
  //       };

  //       for (const tag of baseTags) {
  //         const field = `${meterId}_EM01_${tag}`;
  //         if (item[field] !== undefined) {
  //           entry[tag] = item[field];
  //         }
  //       }

  //       if (Object.keys(entry).length > 2) {
  //         results.push(entry);
  //       }
  //     }
  //   }

  //   return { success: true, data: results };
  // }

  async fetchLogs(query: LogsQueryDto) {
    const { type, meters, start_date, end_date } = query;

    const baseTags = this.tagGroups[type];
    if (!baseTags) {
      return { success: false, message: 'Invalid type specified.' };
    }

    const meterIds = meters.split(',').map((m) => m.trim());

    // Time range 6:00 to next day 6:00:59.999
    const startStr = moment(start_date)
      .startOf('day')
      .add(6, 'hours') // 06:00:00
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    const endStr = moment(end_date)
      .startOf('day')
      .add(30, 'hours') // agle din 06:00
      .add(59, 'seconds')
      .add(999, 'milliseconds')
      .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');

    const dbQuery = {
      timestamp: {
        $gte: startStr,
        $lte: endStr,
      },
    };

    const rawData = await this.logEntryModel.find(dbQuery).lean().exec();

    // Deduplicate by (minute + meterId)
    const uniqueByMinute = new Map<string, any>();

    for (const item of rawData) {
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
          const field = `${meterId}_EM01_${tag}`;
          if (item[field] !== undefined) {
            entry[tag] = item[field];
          }
        }

        if (Object.keys(entry).length > 2) {
          // make key by minute + meter
          const minuteKey =
            meterId + '_' + moment(entry.time).format('YYYY-MM-DD HH:mm');

          if (!uniqueByMinute.has(minuteKey)) {
            uniqueByMinute.set(minuteKey, entry);
          }
        }
      }
    }

    // Convert back to array sorted by timestamp
    const results = Array.from(uniqueByMinute.values()).sort((a, b) =>
      a.time.localeCompare(b.time),
    );

    return { success: true, data: results };
  }
}
