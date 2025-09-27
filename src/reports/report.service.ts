// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable prettier/prettier */
// /* eslint-disable @typescript-eslint/require-await */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Reports } from './schemas/reports.schema';
// import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';

// @Injectable()
// export class ReportsService {
//   constructor(
//     @InjectModel(Reports.name) private usageModel: Model<Reports>,
//     private readonly mongoDateFilter: MongoDateFilterService,
//   ) {}

//   // Helper to generate array of dates between fromDate and toDate inclusive, formatted YYYY-MM-DD
//   private generateDateRange(fromDate: string, toDate: string): string[] {
//     const dates: string[] = [];
//     const from = new Date(fromDate);
//     const to = new Date(toDate);

//     for (let dt = new Date(from); dt <= to; dt.setDate(dt.getDate() + 1)) {
//       dates.push(dt.toISOString().substring(0, 10));
//     }
//     return dates;
//   }

//   async getReport(dto: {
//     date?: string;
//     range?: string;
//     fromDate?: string;
//     toDate?: string;
//     startTime?: string;
//     endTime?: string;
//     towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
//     reportType?: 'realtime' | 'efficiency';
//   }) {
//     const query: any = {};

//     // Date filters using regex on string timestamps
//     if (dto.date) {
//       // Exact single date match YYYY-MM-DD
//       query.timestamp = { $regex: `^${dto.date}` };
//     } else if (dto.range) {
//       throw new Error(
//         'Range filter not supported when timestamps are strings with offsets.',
//       );
//     } else if (dto.fromDate && dto.toDate) {
//       if (dto.fromDate === dto.toDate) {
//         query.timestamp = { $regex: `^${dto.fromDate}` };
//       } else {
//         const dateRange = this.generateDateRange(dto.fromDate, dto.toDate);
//         query.$or = dateRange.map((dateStr) => ({
//           timestamp: { $regex: `^${dateStr}` },
//         }));
//       }
//     }

//     // Time filter
//     if (dto.startTime) {
//       const startTime = dto.startTime;
//       let endTime = dto.endTime;

//       if (!endTime) {
//         const [h, m, s] = startTime.split(':').map(Number);
//         const startInSeconds = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
//         let endInSeconds = startInSeconds + 86400 - 1; // 24 hours - 1 sec

//         if (endInSeconds >= 86400) {
//           endInSeconds = 86399; // cap at 23:59:59
//         }

//         const pad = (n: number) => n.toString().padStart(2, '0');
//         const eh = Math.floor(endInSeconds / 3600);
//         const em = Math.floor((endInSeconds % 3600) / 60);
//         const es = endInSeconds % 60;

//         endTime = `${pad(eh)}:${pad(em)}:${pad(es)}`;
//       }

//       const timeFilter = this.mongoDateFilter.getCustomTimeRange(
//         startTime,
//         endTime,
//       );
//       Object.assign(query, timeFilter);
//     }

//     // Explicitly type projection to avoid type error
//     let projection: Record<string, number> | undefined = undefined;

//     if (dto.towerType) {
//       const sampleDoc = await this.usageModel.findOne().lean();

//       if (sampleDoc) {
//         const towerFields = Object.keys(sampleDoc).filter((key) =>
//           key.startsWith(dto.towerType!),
//         );

//         const commonFields = ['_id', 'timestamp', 'Time', 'UNIXtimestamp'];

//         const fieldsToInclude = [...commonFields, ...towerFields];

//         projection = fieldsToInclude.reduce(
//           (acc, field) => {
//             acc[field] = 1;
//             return acc;
//           },
//           {} as Record<string, number>,
//         );
//       }
//     }

//     // Pass projection if defined, else pass undefined (no projection)
//     const data = await this.usageModel.find(query, projection).lean();

//     // Group by hour and select the first document per hour
//     const hourlyMap = new Map<string, any>();

//     // for (const doc of data) {
//     //   const timestamp = doc.timestamp;
//     //   const hourKey = timestamp.substring(0, 13);

//     //   const existing = hourlyMap.get(hourKey);
//     //   if (!existing || new Date(doc.timestamp) < new Date(existing.timestamp)) {
//     //     hourlyMap.set(hourKey, doc);
//     //   }
//     // }

//     const filteredData = Array.from(hourlyMap.values()).sort(
//       (a, b) =>
//         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
//     );

//     const ambientAirTemp = 30; // °C (example static value)
//     const wetBulbTemp = 25; // °C
//     const fanAmpere = 15; // A

//     let finalData = filteredData;

//     if (dto.reportType === 'realtime') {
//       finalData = filteredData.map((doc) => ({
//         timestamp: doc.timestamp,
//         supplyTemp: doc[`${dto.towerType}_TEMP_RTD_01_AI`] ?? null,
//         returnTemp: doc[`${dto.towerType}_TEMP_RTD_02_AI`] ?? null,
//         deltaTemp:
//           doc[`${dto.towerType}_TEMP_RTD_02_AI`] !== undefined &&
//           doc[`${dto.towerType}_TEMP_RTD_01_AI`] !== undefined
//             ? doc[`${dto.towerType}_TEMP_RTD_02_AI`] -
//               doc[`${dto.towerType}_TEMP_RTD_01_AI`]
//             : null,
//         ambientAirTemp,
//         wetBulbTemp,
//         fanSpeed: doc[`${dto.towerType}_INV_01_SPD_AI`] ?? null,
//         returnWaterFlow: doc[`${dto.towerType}_FM_02_FR`] ?? null,
//         fanAmpere,
//         fanPowerConsumption:
//           doc[`${dto.towerType}_EM01_ActivePower_A_kW`] !== undefined &&
//           doc[`${dto.towerType}_EM01_ActivePower_B_kW`] !== undefined &&
//           doc[`${dto.towerType}_EM01_ActivePower_C_kW`] !== undefined
//             ? doc[`${dto.towerType}_EM01_ActivePower_A_kW`] +
//               doc[`${dto.towerType}_EM01_ActivePower_B_kW`] +
//               doc[`${dto.towerType}_EM01_ActivePower_C_kW`]
//             : null,
//       }));
//     } else if (dto.reportType === 'efficiency') {
//       const wetBulb = 25; // fixed wet bulb temperature
//       const hotWaterTempKey = `${dto.towerType}_TEMP_RTD_02_AI`; // return temp
//       const coldWaterTempKey = `${dto.towerType}_TEMP_RTD_01_AI`; // supply temp
//       const returnWaterFlowKey = `${dto.towerType}_FM_02_FR`; // flow rate
//       const specificHeat = 4.186; // kJ/kg°C for water

//       finalData = filteredData.map((doc) => {
//         const hotWaterTemp = doc[hotWaterTempKey];
//         const coldWaterTemp = doc[coldWaterTempKey];
//         const returnWaterFlow = doc[returnWaterFlowKey];

//         const approach =
//           coldWaterTemp != null && wetBulb != null
//             ? coldWaterTemp - wetBulb
//             : null;

//         // Cooling Efficiency = ((Hot - Cold) / (Hot - WetBulb)) × 100
//         const coolingEfficiency =
//           hotWaterTemp != null && coldWaterTemp != null
//             ? ((hotWaterTemp - coldWaterTemp) / (hotWaterTemp - wetBulb)) * 100
//             : null;

//         // Cooling Capacity = Flow × Cp × (Hot - Cold)
//         const coolingCapacity =
//           returnWaterFlow != null &&
//           hotWaterTemp != null &&
//           coldWaterTemp != null
//             ? returnWaterFlow * specificHeat * (hotWaterTemp - coldWaterTemp)
//             : null;

//         // Drift Loss = (0.05 * Flow) / 100
//         const driftLossRate =
//           returnWaterFlow != null ? (0.05 * returnWaterFlow) / 100 : null;

//         // Evaporation Loss = 0.00085 * 1.8 * Flow * (Hot - Cold)
//         const evaporationLossRate =
//           returnWaterFlow != null &&
//           hotWaterTemp != null &&
//           coldWaterTemp != null
//             ? 0.00085 * 1.8 * returnWaterFlow * (hotWaterTemp - coldWaterTemp)
//             : null;

//         // Blowdown Rate = Evaporation Loss / 6
//         const blowDownRate =
//           evaporationLossRate != null ? evaporationLossRate / 6 : null;

//         // Makeup Water = Drift + Evaporation + Blowdown
//         const makeupWater =
//           driftLossRate != null &&
//           evaporationLossRate != null &&
//           blowDownRate != null
//             ? driftLossRate + evaporationLossRate + blowDownRate
//             : null;

//         return {
//           timestamp: doc.timestamp,
//           approach,
//           coolingEfficiency,
//           coolingCapacity,
//           driftLossRate,
//           blowDownRate,
//           evaporationLossRate,
//           makeupWater,
//         };
//       });
//     }

//     return { message: 'Report (hourly first)', data: finalData };
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reports } from './schemas/reports.schema';
import { MongoDateFilterService } from 'src/helpers/mongodbfilter-utils';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Reports.name) private usageModel: Model<Reports>,
    private readonly mongoDateFilter: MongoDateFilterService,
  ) {}

  private generateDateRange(fromDate: string, toDate: string): string[] {
    const dates: string[] = [];
    const from = new Date(fromDate);
    const to = new Date(toDate);

    for (let dt = new Date(from); dt <= to; dt.setDate(dt.getDate() + 1)) {
      dates.push(dt.toISOString().substring(0, 10));
    }
    return dates;
  }

  //   async getReport(dto: {
  //     date?: string;
  //     range?: string;
  //     fromDate?: string;
  //     toDate?: string;
  //     startTime?: string;
  //     endTime?: string;
  //     towerType?: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
  //     reportType?: 'realtime' | 'efficiency';
  //   }) {
  //     const query: any = {};

  //     if (dto.date) {
  //       query.timestamp = { $regex: `^${dto.date}` };
  //     } else if (dto.range) {
  //       throw new Error(
  //         'Range filter not supported when timestamps are strings with offsets.',
  //       );
  //     } else if (dto.fromDate && dto.toDate) {
  //       if (dto.fromDate === dto.toDate) {
  //         query.timestamp = { $regex: `^${dto.fromDate}` };
  //       } else {
  //         const dateRange = this.generateDateRange(dto.fromDate, dto.toDate);
  //         query.$or = dateRange.map((dateStr) => ({
  //           timestamp: { $regex: `^${dateStr}` },
  //         }));
  //       }
  //     }

  //     if (dto.startTime) {
  //       const startTime = dto.startTime;
  //       let endTime = dto.endTime;

  //       if (!endTime) {
  //         const [h, m, s] = startTime.split(':').map(Number);
  //         const startInSeconds = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  //         let endInSeconds = startInSeconds + 86400 - 1;

  //         if (endInSeconds >= 86400) {
  //           endInSeconds = 86399;
  //         }

  //         const pad = (n: number) => n.toString().padStart(2, '0');
  //         const eh = Math.floor(endInSeconds / 3600);
  //         const em = Math.floor((endInSeconds % 3600) / 60);
  //         const es = endInSeconds % 60;

  //         endTime = `${pad(eh)}:${pad(em)}:${pad(es)}`;
  //       }

  //       const timeFilter = this.mongoDateFilter.getCustomTimeRange(
  //         startTime,
  //         endTime,
  //       );
  //       Object.assign(query, timeFilter);
  //     }

  //     let projection: Record<string, number> | undefined = undefined;

  //     if (dto.towerType) {
  //       const sampleDoc = await this.usageModel.findOne().lean();
  //       if (sampleDoc) {
  //         const towerFields = Object.keys(sampleDoc).filter((key) =>
  //           key.startsWith(dto.towerType!),
  //         );
  //         const commonFields = ['_id', 'timestamp', 'Time', 'UNIXtimestamp'];
  //         const fieldsToInclude = [...commonFields, ...towerFields];

  //         projection = fieldsToInclude.reduce(
  //           (acc, field) => {
  //             acc[field] = 1;
  //             return acc;
  //           },
  //           {} as Record<string, number>,
  //         );
  //       }
  //     }

  //     const data = await this.usageModel.find(query, projection).lean();

  //     // ✅ Group by nearest 15-min interval
  //     const intervalMap = new Map<string, any>();

  //     for (const doc of data) {
  //       const date = new Date(doc.timestamp);

  //       let year = date.getFullYear();
  //       let month = date.getMonth() + 1;
  //       let day = date.getDate();
  //       let hours = date.getHours();

  //       // Round minutes to nearest 15
  //       let minutes = Math.round(date.getMinutes() / 15) * 15;

  //       // Handle overflow (e.g., 60 → next hour)
  //       if (minutes === 60) {
  //         minutes = 0;
  //         hours += 1;

  //         if (hours === 24) {
  //           hours = 0;
  //           day += 1;
  //           if (day > new Date(year, month, 0).getDate()) {
  //             day = 1;
  //             month += 1;
  //             if (month > 12) {
  //               month = 1;
  //               year += 1;
  //             }
  //           }
  //         }
  //       }

  //       const minutesStr = minutes.toString().padStart(2, '0');
  //       const hoursStr = hours.toString().padStart(2, '0');
  //       const dayStr = day.toString().padStart(2, '0');
  //       const monthStr = month.toString().padStart(2, '0');

  //       const intervalKey = `${year}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}`;

  //       const existing = intervalMap.get(intervalKey);
  //       if (!existing || new Date(doc.timestamp) < new Date(existing.timestamp)) {
  //         intervalMap.set(intervalKey, doc);
  //       }
  //     }

  //     const filteredData = Array.from(intervalMap.values()).sort(
  //       (a, b) =>
  //         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  //     );

  //     const ambientAirTemp = 30;
  //     const wetBulbTemp = 25;
  //     const fanAmpere = 15;

  //     let finalData = filteredData;

  //     if (dto.reportType === 'realtime') {
  //       finalData = filteredData.map((doc) => ({
  //         timestamp: doc.timestamp,
  //         supplyTemp: doc[`${dto.towerType}_TEMP_RTD_01_AI`] ?? null,
  //         returnTemp: doc[`${dto.towerType}_TEMP_RTD_02_AI`] ?? null,
  //         deltaTemp:
  //           doc[`${dto.towerType}_TEMP_RTD_02_AI`] !== undefined &&
  //           doc[`${dto.towerType}_TEMP_RTD_01_AI`] !== undefined
  //             ? doc[`${dto.towerType}_TEMP_RTD_02_AI`] -
  //               doc[`${dto.towerType}_TEMP_RTD_01_AI`]
  //             : null,
  //         ambientAirTemp,
  //         wetBulbTemp,
  //         fanSpeed: doc[`${dto.towerType}_INV_01_SPD_AI`] ?? null,
  //         returnWaterFlow: doc[`${dto.towerType}_FM_02_FR`] ?? null,
  //         fanAmpere,
  //         fanPowerConsumption:
  //           doc[`${dto.towerType}_EM01_ActivePower_A_kW`] !== undefined &&
  //           doc[`${dto.towerType}_EM01_ActivePower_B_kW`] !== undefined &&
  //           doc[`${dto.towerType}_EM01_ActivePower_C_kW`] !== undefined
  //             ? doc[`${dto.towerType}_EM01_ActivePower_A_kW`] +
  //               doc[`${dto.towerType}_EM01_ActivePower_B_kW`] +
  //               doc[`${dto.towerType}_EM01_ActivePower_C_kW`]
  //             : null,
  //       }));
  //     } else if (dto.reportType === 'efficiency') {
  //       const wetBulb = 25;
  //       const hotWaterTempKey = `${dto.towerType}_TEMP_RTD_02_AI`;
  //       const coldWaterTempKey = `${dto.towerType}_TEMP_RTD_01_AI`;
  //       const returnWaterFlowKey = `${dto.towerType}_FM_02_FR`;
  //       const specificHeat = 4.186;

  //       finalData = filteredData.map((doc) => {
  //         const hotWaterTemp = doc[hotWaterTempKey];
  //         const coldWaterTemp = doc[coldWaterTempKey];
  //         const returnWaterFlow = doc[returnWaterFlowKey];

  //         const approach =
  //           coldWaterTemp != null && wetBulb != null
  //             ? coldWaterTemp - wetBulb
  //             : null;

  //         const coolingEfficiency =
  //           hotWaterTemp != null && coldWaterTemp != null
  //             ? ((hotWaterTemp - coldWaterTemp) / (hotWaterTemp - wetBulb)) * 100
  //             : null;

  //         const coolingCapacity =
  //           returnWaterFlow != null &&
  //           hotWaterTemp != null &&
  //           coldWaterTemp != null
  //             ? returnWaterFlow * specificHeat * (hotWaterTemp - coldWaterTemp)
  //             : null;

  //         const driftLossRate =
  //           returnWaterFlow != null ? (0.05 * returnWaterFlow) / 100 : null;

  //         const evaporationLossRate =
  //           returnWaterFlow != null &&
  //           hotWaterTemp != null &&
  //           coldWaterTemp != null
  //             ? 0.00085 * 1.8 * returnWaterFlow * (hotWaterTemp - coldWaterTemp)
  //             : null;

  //         const blowDownRate =
  //           evaporationLossRate != null ? evaporationLossRate / 6 : null;

  //         const makeupWater =
  //           driftLossRate != null &&
  //           evaporationLossRate != null &&
  //           blowDownRate != null
  //             ? driftLossRate + evaporationLossRate + blowDownRate
  //             : null;

  //         return {
  //           timestamp: doc.timestamp,
  //           approach,
  //           coolingEfficiency,
  //           coolingCapacity,
  //           driftLossRate,
  //           blowDownRate,
  //           evaporationLossRate,
  //           makeupWater,
  //         };
  //       });
  //     }

  //     return { message: 'Report (15-min rounded intervals)', data: finalData };
  //   }

  async getReport(dto: {
    fromDate: string;
    toDate: string;
    startTime?: string;
    endTime?: string;
    towerType: 'CHCT1' | 'CHCT2' | 'CT1' | 'CT2';
    reportType: 'realtime' | 'efficiency';
  }) {
    // 1️⃣ Build date filter query using regex
    const query: any = {};
    if (dto.fromDate && dto.toDate) {
      if (dto.fromDate === dto.toDate) {
        query.timestamp = { $regex: `^${dto.fromDate}` };
      } else {
        const dateRange = this.generateDateRange(dto.fromDate, dto.toDate);
        query.$or = dateRange.map((d) => ({ timestamp: { $regex: `^${d}` } }));
      }
    }

    // 2️⃣ Projection for towerType
    let projection: Record<string, number> | undefined;
    const sampleDoc = await this.usageModel.findOne().lean();
    if (sampleDoc) {
      const towerFields = Object.keys(sampleDoc).filter((k) =>
        k.startsWith(dto.towerType),
      );
      const commonFields = ['_id', 'timestamp', 'Time', 'UNIXtimestamp'];
      const fieldsToInclude = [...commonFields, ...towerFields];
      projection = fieldsToInclude.reduce(
        (acc, f) => ({ ...acc, [f]: 1 }),
        {} as Record<string, number>,
      );
    }

    // 3️⃣ Fetch data
    const data = await this.usageModel.find(query, projection).lean();

    // 4️⃣ Convert HH:MM:SS string to seconds
    const timeStrToSeconds = (tsString: string) => {
      const timePart = tsString.substring(11, 19); // "HH:MM:SS"
      const [h, m, s] = timePart.split(':').map(Number);
      return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    };

    const startSeconds = dto.startTime
      ? timeStrToSeconds(dto.fromDate + 'T' + dto.startTime)
      : 0;
    const endSeconds = dto.endTime
      ? timeStrToSeconds(dto.toDate + 'T' + dto.endTime)
      : 86400;

    // 5️⃣ Strict filtering for fromDate, toDate, and intermediate days
    const filteredData = data.filter((doc) => {
      const docDate = doc.timestamp.substring(0, 10);
      const docSeconds = timeStrToSeconds(doc.timestamp);

      if (docDate === dto.fromDate && docDate === dto.toDate) {
        return docSeconds >= startSeconds && docSeconds <= endSeconds;
      }

      if (docDate === dto.fromDate) {
        return docSeconds >= startSeconds && docSeconds <= endSeconds;
      }

      if (docDate === dto.toDate) {
        return docSeconds >= 0 && docSeconds <= endSeconds;
      }

      if (docDate > dto.fromDate && docDate < dto.toDate) {
        return true;
      }

      return false;
    });

    // 6️⃣ Round timestamps to nearest 15-min interval
    const pad = (n: number) => n.toString().padStart(2, '0');
    const intervalMap = new Map<string, any>();

    for (const doc of filteredData) {
      const h = parseInt(doc.timestamp.substring(11, 13), 10);
      let m =
        Math.round(parseInt(doc.timestamp.substring(14, 16), 10) / 15) * 15;
      let hh = h;
      let dayStr = doc.timestamp.substring(0, 10);

      if (m === 60) {
        m = 0;
        hh += 1;
        if (hh === 24) {
          hh = 0;
          // next day
          const nextDay = new Date(dayStr);
          nextDay.setDate(nextDay.getDate() + 1);
          dayStr = nextDay.toISOString().substring(0, 10);
        }
      }

      const intervalKey = `${dayStr}T${pad(hh)}:${pad(m)}`;
      const existing = intervalMap.get(intervalKey);
      if (!existing || new Date(doc.timestamp) < new Date(existing.timestamp)) {
        intervalMap.set(intervalKey, doc);
      }
    }

    const sortedData = Array.from(intervalMap.values()).sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // 7️⃣ Prepare final report
    const ambientAirTemp = 30;
    const wetBulbTemp = 25;
    const fanAmpere = 15;

    if (dto.reportType === 'realtime') {
      return {
        message:
          'Report (15-min intervals, exact start/end times, string timestamps)',
        data: sortedData.map((doc) => ({
          timestamp: doc.timestamp,
          supplyTemp: doc[`${dto.towerType}_TEMP_RTD_01_AI`] ?? null,
          returnTemp: doc[`${dto.towerType}_TEMP_RTD_02_AI`] ?? null,
          deltaTemp:
            doc[`${dto.towerType}_TEMP_RTD_01_AI`] !== undefined &&
            doc[`${dto.towerType}_TEMP_RTD_02_AI`] !== undefined
              ? doc[`${dto.towerType}_TEMP_RTD_02_AI`] -
                doc[`${dto.towerType}_TEMP_RTD_01_AI`]
              : null,
          ambientAirTemp,
          wetBulbTemp,
          fanSpeed: doc[`${dto.towerType}_INV_01_SPD_AI`] ?? null,
          returnWaterFlow: doc[`${dto.towerType}_FM_02_FR`] ?? null,
          fanAmpere,
          fanPowerConsumption:
            doc[`${dto.towerType}_EM01_ActivePower_A_kW`] !== undefined &&
            doc[`${dto.towerType}_EM01_ActivePower_B_kW`] !== undefined &&
            doc[`${dto.towerType}_EM01_ActivePower_C_kW`] !== undefined
              ? doc[`${dto.towerType}_EM01_ActivePower_A_kW`] +
                doc[`${dto.towerType}_EM01_ActivePower_B_kW`] +
                doc[`${dto.towerType}_EM01_ActivePower_C_kW`]
              : null,
        })),
      };
    }

    return { message: 'Report type not implemented', data: sortedData };
  }
}
