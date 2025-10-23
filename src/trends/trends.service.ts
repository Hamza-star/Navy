// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/require-await */
// /* eslint-disable prefer-const */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from './formulas.service';
// import { params } from 'utils/param-groups';

// @Injectable()
// export class TrendsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy_historical');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   // 🔹 return all parameters (for dropdown)
//   async getList() {
//     return params;
//   }

//   // 🔹 main logic for trends data
//   async getTrends(payload: any) {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       limit = 1000,
//       skip = 0,
//       sortOrder = 'asc',
//     } = payload;

//     // 🧩 validate
//     if (!mode) throw new Error('Mode is required');

//     // --- Query setup ---
//     let query: any = {};

//     if (mode === 'historical') {
//       if (!startDate || !endDate)
//         throw new Error('startDate and endDate are required');
//       query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
//     } else if (mode === 'range') {
//       query.Genset_Run_SS = { $gte: 1, $lte: 6 };
//     } else {
//       throw new Error('Invalid mode');
//     }

//     // --- Projection setup ---
//     const projection = selectedParams.reduce(
//       (acc: any, key: string) => ({ ...acc, [key]: 1 }),
//       { timestamp: 1 },
//     );

//     // --- Fetch data ---
//     const docs = await this.collection
//       .find(query, { projection })
//       .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
//       .skip(skip)
//       .limit(limit)
//       .toArray();

//     // --- Process data ---
//     const data = docs.map((doc) => {
//       const record: any = { timestamp: doc.timestamp };

//       for (const param of selectedParams) {
//         let value: any;
//         switch (param) {
//           case 'Load_Percent':
//             value = this.formulasService.calculateLoadPercent(doc);
//             break;
//           case 'Running_Hours':
//             value = this.formulasService.calculateRunningHours(doc);
//             break;
//           case 'Current_Imbalance':
//             value = this.formulasService.calculateCurrentImbalance(doc);
//             break;
//           case 'Voltage_Imbalance':
//             value = this.formulasService.calculateVoltageImbalance(doc);
//             break;
//           case 'Power_Loss_Factor':
//             value = this.formulasService.calculatePowerLossFactor(doc);
//             break;
//           case 'Thermal_Stress':
//             value = this.formulasService.calculateThermalStress(doc);
//             break;
//           default:
//             value = doc[param] ?? null;
//         }
//         record[param] = value;
//       }

//       return record;
//     });

//     // --- Return array of objects with param names ---
//     return data;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from './formulas.service';
import { params } from 'utils/param-groups';

@Injectable()
export class TrendsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_historical');
    this.collection.createIndex({ timestamp: 1 });
  }

  // 🔹 return all parameters (for dropdown)
  async getList() {
    return params;
  }

  // 🔹 main logic for trends data
  async getTrends(payload: any) {
    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      limit = 1000,
      skip = 0,
      sortOrder = 'asc',
    } = payload;

    // 🧩 validate
    if (!mode) throw new Error('Mode is required');

    // --- Query setup ---
    let query: any = {};

    if (mode === 'historic') {
      if (!startDate || !endDate)
        throw new Error('startDate and endDate are required');

      // 🔹 Peek one document to check timestamp type
      const sampleDoc = await this.collection.findOne(
        {},
        { projection: { timestamp: 1 } },
      );
      const isTimestampString =
        sampleDoc && typeof sampleDoc.timestamp === 'string';

      if (isTimestampString) {
        // 🔸 String-based comparison
        query.timestamp = { $gte: startDate, $lte: endDate };
      } else {
        // 🔸 Date-based comparison
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
    } else if (mode === 'range') {
      query.Genset_Run_SS = { $gte: 1, $lte: 6 };
    } else {
      throw new Error('Invalid mode');
    }

    // --- Projection setup ---
    const projection = selectedParams.reduce(
      (acc: any, key: string) => ({ ...acc, [key]: 1 }),
      { timestamp: 1 },
    );

    // --- Fetch data ---
    const docs = await this.collection
      .find(query, { projection })
      .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // --- Process data ---
    const data = docs.map((doc) => {
      const record: any = { timestamp: doc.timestamp };

      for (const param of selectedParams) {
        let value: any;
        switch (param) {
          case 'Load_Percent':
            value = this.formulasService.calculateLoadPercent(doc);
            break;
          case 'Running_Hours':
            value = this.formulasService.calculateRunningHours(doc);
            break;
          case 'Current_Imbalance':
            value = this.formulasService.calculateCurrentImbalance(doc);
            break;
          case 'Voltage_Imbalance':
            value = this.formulasService.calculateVoltageImbalance(doc);
            break;
          case 'Power_Loss_Factor':
            value = this.formulasService.calculatePowerLossFactor(doc);
            break;
          case 'Thermal_Stress':
            value = this.formulasService.calculateThermalStress(doc);
            break;
          default:
            value = doc[param] ?? null;
        }
        record[param] = value;
      }

      return record;
    });

    return data;
  }
}
