/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
    this.collection.createIndex({ timestamp: 1 });
  }

  private formatTimestamp(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private toISOStringString(dateStr: string) {
    return new Date(dateStr).toISOString();
  }

  async getFuelReport(payload: {
    startDate: string;
    endDate: string;
    fuelCostPerLitre: number;
  }) {
    const { startDate, endDate, fuelCostPerLitre } = payload;

    if (!startDate || !endDate)
      throw new Error('startDate and endDate are required');

    // 🔹 Detect timestamp type
    const sampleDoc = await this.collection.findOne(
      {},
      { projection: { timestamp: 1 } },
    );
    const isTimestampString =
      sampleDoc && typeof sampleDoc.timestamp === 'string';

    // 🔹 Query only within date range
    const query = isTimestampString
      ? {
          timestamp: {
            $gte: this.toISOStringString(startDate),
            $lte: this.toISOStringString(endDate),
          },
        }
      : {
          timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        };

    const projection = {
      timestamp: 1,
      Fuel_Rate: 1,
      Genset_Total_kW: 1,
      Genset_Application_kW_Rating_PC2X: 1,
      Genset_Run_SS: 1,
    };

    const docs = await this.collection
      .find(query, { projection })
      .sort({ timestamp: 1 })
      .toArray();

    if (!docs.length) {
      return [
        {
          Duration: '0 mins (0.00 hr)',
          Fuel_Consumed: '0.00 Ltrs',
          Production: '0.00 kWh',
          Cost: '0',
          TotalCost: '0',
        },
      ];
    }

    // 🔹 Format timestamps
    const data = docs.map((d) => ({
      ...d,
      timestamp: this.formatTimestamp(d.timestamp),
    }));

    // 🔹 Compute fuel per record
    const fuelData = this.formulasService.calculateFuelConsumption(data);

    // 🔹 Merge fuel data with genset info
    const merged = fuelData.map((f, i) => ({
      ...f,
      Genset_Total_kW: data[i]?.Genset_Total_kW ?? 0,
      Genset_Run_SS: data[i]?.Genset_Run_SS ?? 0,
    }));

    // 🔹 Detect ON–OFF intervals
    const intervals: any[] = [];
    let currentInterval: any[] = [];

    for (const record of merged) {
      if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
        currentInterval.push(record);
      } else if (currentInterval.length > 0) {
        intervals.push(currentInterval);
        currentInterval = [];
      }
    }
    if (currentInterval.length > 0) intervals.push(currentInterval);

    // 🔹 Calculate per-interval data
    const reportRows: any[] = [];
    let totalFuel = 0;
    let totalProduction = 0;
    let totalCost = 0;

    for (const interval of intervals) {
      const start = interval[0].time;
      const end = interval[interval.length - 1].time;

      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      const durationMins =
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
      const runHours = +(durationMins / 60).toFixed(2);

      const fuelConsumed = +interval
        .reduce((sum, r) => sum + (r.Fuel_Used ?? 0), 0)
        .toFixed(2);

      const avgKW =
        interval.reduce((sum, r) => sum + (r.Genset_Total_kW ?? 0), 0) /
        (interval.length || 1);

      const production = +(avgKW * runHours).toFixed(2);
      const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
      const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

      totalFuel += fuelConsumed;
      totalProduction += production;
      totalCost += cost;

      // Format interval time like “03:00–03:30”
      const formatTime = (d: Date) =>
        `${d.getUTCHours().toString().padStart(2, '0')}:${d
          .getUTCMinutes()
          .toString()
          .padStart(2, '0')}`;

      reportRows.push({
        Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumed} Ltrs`,
        Production: `${production} kWh`,
        Cost: cost,
        CostPerUnit: costPerUnit,
        TotalCost: cost,
      });
    }

    // 🔹 Totals row
    reportRows.push({
      Duration: 'TOTAL',
      Fuel_Consumed: `${totalFuel.toFixed(2)} Ltrs`,
      Production: `${totalProduction.toFixed(2)} kWh`,
      Cost: totalCost.toFixed(0),
      TotalCost: totalCost.toFixed(0),
    });

    return reportRows;
  }
}
