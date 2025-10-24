/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class ReportsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy_historical');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   private formatTimestamp(value: any): string {
//     if (!value) return '';

//     const date = new Date(value);
//     // Convert UTC → Karachi time (UTC+5)
//     const karachiTime = new Date(date.getTime() + 5 * 60 * 60 * 1000);

//     const year = karachiTime.getUTCFullYear();
//     const month = (karachiTime.getUTCMonth() + 1).toString().padStart(2, '0');
//     const day = karachiTime.getUTCDate().toString().padStart(2, '0');
//     const hours = karachiTime.getUTCHours().toString().padStart(2, '0');
//     const minutes = karachiTime.getUTCMinutes().toString().padStart(2, '0');
//     const seconds = karachiTime.getUTCSeconds().toString().padStart(2, '0');

//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   }

//   // async getFuelReport(payload: {
//   //   startDate: string;
//   //   endDate: string;
//   //   fuelCostPerLitre: number;
//   // }) {
//   //   const { startDate, endDate, fuelCostPerLitre } = payload;

//   //   if (!startDate || !endDate)
//   //     throw new Error('startDate and endDate are required');

//   //   // Detect timestamp type from one sample
//   //   const sampleDoc = await this.collection.findOne(
//   //     {},
//   //     { projection: { timestamp: 1 } },
//   //   );
//   //   const isTimestampString =
//   //     sampleDoc && typeof sampleDoc.timestamp === 'string';

//   //   // Build query based on type
//   //   const query = isTimestampString
//   //     ? { timestamp: { $gte: startDate, $lte: endDate } }
//   //     : {
//   //         timestamp: {
//   //           $gte: new Date(startDate),
//   //           $lte: new Date(endDate),
//   //         },
//   //       };

//   //   const projection = {
//   //     timestamp: 1,
//   //     Fuel_Rate: 1,
//   //     Genset_Total_kW: 1,
//   //     Genset_Application_kW_Rating_PC2X: 1,
//   //   };

//   //   const docs = await this.collection
//   //     .find(query, { projection })
//   //     .sort({ timestamp: 1 })
//   //     .toArray();

//   //   if (!docs.length) return [];

//   //   const data = docs.map((d) => ({
//   //     ...d,
//   //     timestamp: this.formatTimestamp(d.timestamp),
//   //   }));

//   //   const fuelData = this.formulasService.calculateFuelConsumption(data);

//   //   const groupedByDate: Record<string, any[]> = {};
//   //   for (const record of fuelData) {
//   //     const dateKey = record.time.split(' ')[0];
//   //     if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
//   //     groupedByDate[dateKey].push(record);
//   //   }

//   //   const reportRows: any[] = [];
//   //   let totalFuel = 0;
//   //   let totalProduction = 0;
//   //   let totalCost = 0;

//   //   for (const [date, records] of Object.entries(groupedByDate)) {
//   //     const start = records[0].time;
//   //     const end = records[records.length - 1].time;

//   //     const durationMins =
//   //       (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
//   //     const runHours = +(durationMins / 60).toFixed(2);

//   //     const fuelConsumed = +records
//   //       .reduce((sum, r) => sum + (r.Fuel_Used ?? 0), 0)
//   //       .toFixed(2);

//   //     const avgKW =
//   //       records.reduce((sum, r) => sum + (r.Genset_Total_kW ?? 0), 0) /
//   //       (records.length || 1);
//   //     const production = +(avgKW * runHours).toFixed(2);

//   //     const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//   //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//   //     totalFuel += fuelConsumed;
//   //     totalProduction += production;
//   //     totalCost += cost;

//   //     reportRows.push({
//   //       Date: date,
//   //       Duration: `${Math.floor(durationMins)} mins (${runHours} hr)`,
//   //       Run_Hours: runHours,
//   //       Fuel_Consumed: `${fuelConsumed} Ltrs`,
//   //       Production: `${production} kWh`,
//   //       Cost: cost,
//   //       CostPerUnit: costPerUnit,
//   //       TotalCost: cost,
//   //     });
//   //   }

//   //   reportRows.push({
//   //     Date: 'TOTAL',
//   //     Duration: `${(totalProduction / 60).toFixed(2)} hrs`,
//   //     Fuel_Consumed: `${totalFuel.toFixed(2)} Ltrs`,
//   //     Production: `${totalProduction.toFixed(2)} kWh`,
//   //     Cost: totalCost.toFixed(0),
//   //     TotalCost: totalCost.toFixed(0),
//   //   });

//   //   return reportRows;
//   // }

// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prefer-const */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

@Injectable()
export class ReportsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_historical');
  }

  // --- Helper: Convert to ISO string for Mongo string timestamps ---
  private toISOStringString(dateStr: string): string {
    return new Date(dateStr).toISOString();
  }

  // --- Helper: Round to nearest 15 minutes ---
  private roundToNearest15Minutes(date: Date): Date {
    const ms = 1000 * 60 * 15;
    return new Date(Math.round(date.getTime() / ms) * ms);
  }

  // --- Helper: Format for Karachi timezone ---
  private formatKarachi(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-GB', options)
      .format(date)
      .replace(',', '');
  }

  // --- Main Report Generator ---
  async generateReport(payload: any) {
    const { startDate, endDate, fuelCostPerLitre = 1 } = payload;

    if (!startDate || !endDate)
      throw new Error('startDate and endDate are required');

    // ✅ Query for string timestamps and only ON periods
    const query = {
      timestamp: {
        $gte: this.toISOStringString(startDate),
        $lte: this.toISOStringString(endDate),
      },
      Genset_Run_SS: { $gte: 1, $lte: 6 },
    };

    const projection = {
      timestamp: 1,
      Fuel_Rate: 1,
      Genset_Total_kW: 1,
      Genset_Application_kW_Rating_PC2X: 1,
    };

    const docs = await this.collection
      .find(query, { projection })
      .sort({ timestamp: 1 })
      .toArray();

    if (!docs.length) {
      return [
        {
          Date: 'TOTAL',
          Duration: '0.00 hrs',
          Fuel_Consumed: '0.00 Ltrs',
          Production: '0.00 kWh',
          Cost: fuelCostPerLitre.toString(),
          TotalCost: '0',
        },
      ];
    }

    // --- Convert timestamps for Karachi display ---
    const data = docs.map((d) => ({
      ...d,
      timestamp: this.formatKarachi(new Date(d.timestamp)),
    }));

    // --- Group data into 15-min intervals ---
    const intervalMs = 15 * 60 * 1000;
    let current: any[] = [];
    const intervals: any[] = [];

    let lastTs = new Date(docs[0].timestamp).getTime();

    for (const d of docs) {
      const ts = new Date(d.timestamp).getTime();
      if (ts - lastTs <= intervalMs) {
        current.push(d);
      } else {
        if (current.length) intervals.push(current);
        current = [d];
      }
      lastTs = ts;
    }
    if (current.length) intervals.push(current);

    // --- Process intervals ---
    const rows: any[] = [];
    let totalFuel = 0;
    let totalProd = 0;
    let totalCost = 0;

    for (const interval of intervals) {
      const start = new Date(interval[0].timestamp);
      const end = new Date(interval[interval.length - 1].timestamp);

      const startRounded = this.roundToNearest15Minutes(start);
      const endRounded = this.roundToNearest15Minutes(end);

      const durationHrs =
        (endRounded.getTime() - startRounded.getTime()) / (1000 * 60 * 60);

      // --- Calculate fuel used ---
      let fuelUsed = 0;
      for (const d of interval) {
        const rate = d.Fuel_Rate ?? 0;
        fuelUsed += (rate * 3) / 3600; // assuming 3-sec sampling
      }

      // --- Calculate production (kWh) ---
      let production = 0;
      for (const d of interval) {
        const kW = d.Genset_Total_kW ?? 0;
        production += kW * (3 / 3600);
      }

      const cost = +(fuelUsed * fuelCostPerLitre).toFixed(2);

      totalFuel += fuelUsed;
      totalProd += production;
      totalCost += cost;

      const dateStr = this.formatKarachi(startRounded).split(' ')[0];
      const fmt = (d: Date) =>
        `${d.getHours().toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

      rows.push({
        Date: dateStr,
        Duration: `${fmt(startRounded)} - ${fmt(endRounded)}`,
        Fuel_Consumed: `${fuelUsed.toFixed(2)} Ltrs`,
        Production: `${production.toFixed(2)} kWh`,
        Cost: fuelCostPerLitre.toString(),
        TotalCost: `${cost.toFixed(2)}`,
      });
    }

    // --- Add total summary row ---
    rows.push({
      Date: 'TOTAL',
      Duration: `${(intervals.length * 0.25).toFixed(2)} hrs`,
      Fuel_Consumed: `${totalFuel.toFixed(2)} Ltrs`,
      Production: `${totalProd.toFixed(2)} kWh`,
      Cost: fuelCostPerLitre.toString(),
      TotalCost: `${totalCost.toFixed(2)}`,
    });

    return rows;
  }
}
