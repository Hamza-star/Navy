// import { Injectable } from '@nestjs/common';
// import { DateTime } from 'luxon';

// @Injectable()
// export class MongoService {
//   private tz = 'Asia/Karachi';
//   private dayStartHour = 6;

//   // Shift JS Date to 6AM local
//   shiftDateToDayStart(date: Date): DateTime {
//     return DateTime.fromJSDate(date, { zone: this.tz }).set({
//       hour: this.dayStartHour,
//       minute: 0,
//       second: 0,
//       millisecond: 0,
//     });
//   }

//   // Custom date range 6AM → 6AM
//   getCustom6AMDateRange(
//     from: Date | string,
//     to?: Date | string,
//   ): { $gte: string; $lte: string } {
//     const fromDT = this.shiftDateToDayStart(
//       typeof from === 'string' ? new Date(from) : from,
//     );
//     const toDT = to
//       ? this.shiftDateToDayStart(typeof to === 'string' ? new Date(to) : to)
//           .plus({ days: 1 })
//           .minus({ seconds: 1 })
//       : fromDT.plus({ days: 1 }).minus({ seconds: 1 });

//     return { $gte: fromDT.toISO(), $lte: toDT.toISO() };
//   }

//   // Today / Yesterday filter 6AM → 6AM
//   getDateRangeFilter(range: 'today' | 'yesterday'): {
//     $gte: string;
//     $lte: string;
//   } {
//     let fromDT = DateTime.now()
//       .setZone(this.tz)
//       .set({ hour: this.dayStartHour, minute: 0, second: 0, millisecond: 0 });
//     if (range === 'yesterday') fromDT = fromDT.minus({ days: 1 });

//     const toDT = fromDT.plus({ days: 1 }).minus({ seconds: 1 });
//     return { $gte: fromDT.toISO(), $lte: toDT.toISO() };
//   }

//   // Single time range for hours
//   getCustomTimeRange(startTime: string, endTime: string): { $expr: object } {
//     const parseTime = (t: string) => {
//       const [h, m, s] = t.split(':').map(Number);
//       return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
//     };
//     const startSec = parseTime(startTime);
//     const endSec = parseTime(endTime);

//     return {
//       $expr: {
//         $and: [
//           {
//             $gte: [
//               { $toLong: { $substrBytes: ['$timestamp', 11, 8] } }, // simplified, adjust if needed
//               startSec,
//             ],
//           },
//           {
//             $lte: [
//               { $toLong: { $substrBytes: ['$timestamp', 11, 8] } },
//               endSec,
//             ],
//           },
//         ],
//       },
//     };
//   }
// }

// import { Injectable } from '@nestjs/common';
// import { DateTime } from 'luxon';

// @Injectable()
// export class MongoDateFilterService {
//   private tz = 'Asia/Karachi';
//   private dayStartHour = 6;

//   // Shift JS Date to 6AM local
//   shiftDateToDayStart(date: Date): DateTime {
//     return DateTime.fromJSDate(date, { zone: this.tz }).set({
//       hour: this.dayStartHour,
//       minute: 0,
//       second: 0,
//       millisecond: 0,
//     });
//   }

//   // Custom date range 6AM → 6AM
//   getCustom6AMDateRange(
//     from: Date | string,
//     to?: Date | string,
//   ): { $gte: string; $lte: string } {
//     const fromDT = this.shiftDateToDayStart(
//       typeof from === 'string' ? new Date(from) : from,
//     );
//     const toDT = to
//       ? this.shiftDateToDayStart(typeof to === 'string' ? new Date(to) : to)
//           .plus({ days: 1 })
//           .minus({ seconds: 1 })
//       : fromDT.plus({ days: 1 }).minus({ seconds: 1 });

//     return { $gte: fromDT.toISO(), $lte: toDT.toISO() };
//   }

//   // Today / Yesterday filter 6AM → 6AM
//   getDateRangeFilter(range: 'today' | 'yesterday'): {
//     $gte: string;
//     $lte: string;
//   } {
//     let fromDT = DateTime.now()
//       .setZone(this.tz)
//       .set({ hour: this.dayStartHour, minute: 0, second: 0, millisecond: 0 });
//     if (range === 'yesterday') fromDT = fromDT.minus({ days: 1 });

//     const toDT = fromDT.plus({ days: 1 }).minus({ seconds: 1 });
//     return { $gte: fromDT.toISO(), $lte: toDT.toISO() };
//   }

//   // Single time range for hours
//   getCustomTimeRange(startTime: string, endTime: string): { $expr: object } {
//     const parseTime = (t: string) => {
//       const [h, m, s] = t.split(':').map(Number);
//       return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
//     };
//     const startSec = parseTime(startTime);
//     const endSec = parseTime(endTime);

//     return {
//       $expr: {
//         $and: [
//           {
//             $gte: [
//               {
//                 $add: [
//                   {
//                     $multiply: [
//                       {
//                         $toInt: {
//                           $arrayElemAt: [
//                             {
//                               $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                             },
//                             0,
//                           ],
//                         },
//                       },
//                       3600,
//                     ],
//                   },
//                   {
//                     $multiply: [
//                       {
//                         $toInt: {
//                           $arrayElemAt: [
//                             {
//                               $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                             },
//                             1,
//                           ],
//                         },
//                       },
//                       60,
//                     ],
//                   },
//                   {
//                     $toInt: {
//                       $arrayElemAt: [
//                         { $split: [{ $substr: ['$timestamp', 11, 8] }, ':'] },
//                         2,
//                       ],
//                     },
//                   },
//                 ],
//               },
//               startSec,
//             ],
//           },
//           {
//             $lte: [
//               {
//                 $add: [
//                   {
//                     $multiply: [
//                       {
//                         $toInt: {
//                           $arrayElemAt: [
//                             {
//                               $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                             },
//                             0,
//                           ],
//                         },
//                       },
//                       3600,
//                     ],
//                   },
//                   {
//                     $multiply: [
//                       {
//                         $toInt: {
//                           $arrayElemAt: [
//                             {
//                               $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                             },
//                             1,
//                           ],
//                         },
//                       },
//                       60,
//                     ],
//                   },
//                   {
//                     $toInt: {
//                       $arrayElemAt: [
//                         { $split: [{ $substr: ['$timestamp', 11, 8] }, ':'] },
//                         2,
//                       ],
//                     },
//                   },
//                 ],
//               },
//               endSec,
//             ],
//           },
//         ],
//       },
//     };
//   }
// }

import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

@Injectable()
export class MongoService {
  private readonly tz = 'Asia/Karachi';
  private readonly dayStartHour = 6;

  // ------------------------
  // Helper: shift to 6 AM day start
  // ------------------------
  private shiftDateToDayStart(date: Date): DateTime {
    return DateTime.fromJSDate(date, { zone: this.tz }).set({
      hour: this.dayStartHour,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
  }

  // ------------------------
  // Custom Date Range (6 AM → 6 AM next day)
  // ------------------------
  getCustom6AMDateRange(
    from: Date | string,
    to?: Date | string,
  ): { $gte: string; $lte: string } {
    const fromDT = this.shiftDateToDayStart(
      typeof from === 'string' ? new Date(from) : from,
    );

    const toDT = to
      ? this.shiftDateToDayStart(
          typeof to === 'string' ? new Date(to) : to,
        ).plus({ days: 1 })
      : fromDT.plus({ days: 1 });

    // NOTE: No minus({ seconds: 1 }) → ensures last 5:45 interval is included
    return {
      $gte: fromDT.toISO(),
      $lte: toDT.toISO(),
    };
  }

  // ------------------------
  // Predefined ranges (today / yesterday)
  // ------------------------
  // ------------------------
  // Extended: Predefined ranges (today, yesterday, week, month, year etc.)
  // ------------------------
  get6AMDateRange(
    range:
      | 'today'
      | 'yesterday'
      | 'week'
      | 'lastWeek'
      | 'month'
      | 'lastMonth'
      | 'year'
      | 'lastYear',
  ): { $gte: string; $lte: string } {
    const now = DateTime.now().setZone(this.tz);
    let fromDT: DateTime;
    let toDT: DateTime;

    switch (range) {
      case 'today':
        fromDT = this.shiftDateToDayStart(now.toJSDate());
        toDT = fromDT.plus({ days: 1 });
        break;

      case 'yesterday':
        fromDT = this.shiftDateToDayStart(now.minus({ days: 1 }).toJSDate());
        toDT = fromDT.plus({ days: 1 });
        break;

      case 'week':
        fromDT = this.shiftDateToDayStart(now.startOf('week').toJSDate());
        toDT = this.shiftDateToDayStart(now.endOf('week').toJSDate()).plus({
          days: 1,
        });
        break;

      case 'lastWeek':
        fromDT = this.shiftDateToDayStart(
          now.minus({ weeks: 1 }).startOf('week').toJSDate(),
        );
        toDT = this.shiftDateToDayStart(
          now.minus({ weeks: 1 }).endOf('week').toJSDate(),
        ).plus({ days: 1 });
        break;

      case 'month':
        fromDT = this.shiftDateToDayStart(now.startOf('month').toJSDate());
        toDT = this.shiftDateToDayStart(now.endOf('month').toJSDate()).plus({
          days: 1,
        });
        break;

      case 'lastMonth':
        fromDT = this.shiftDateToDayStart(
          now.minus({ months: 1 }).startOf('month').toJSDate(),
        );
        toDT = this.shiftDateToDayStart(
          now.minus({ months: 1 }).endOf('month').toJSDate(),
        ).plus({ days: 1 });
        break;

      case 'year':
        fromDT = this.shiftDateToDayStart(now.startOf('year').toJSDate());
        toDT = this.shiftDateToDayStart(now.endOf('year').toJSDate()).plus({
          days: 1,
        });
        break;

      case 'lastYear':
        fromDT = this.shiftDateToDayStart(
          now.minus({ years: 1 }).startOf('year').toJSDate(),
        );
        toDT = this.shiftDateToDayStart(
          now.minus({ years: 1 }).endOf('year').toJSDate(),
        ).plus({ days: 1 });
        break;

      default:
        fromDT = this.shiftDateToDayStart(now.toJSDate());
        toDT = fromDT.plus({ days: 1 });
        break;
    }

    return {
      $gte: fromDT.toISO(),
      $lte: toDT.toISO(),
    };
  }

  // ------------------------
  // Optional: Time range (within a day)
  // ------------------------
  getCustomTimeRange(startTime: string, endTime: string): { timestamp: any } {
    const today = DateTime.now().setZone(this.tz).startOf('day');
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const from = today.set({ hour: startHour, minute: startMinute });
    const to = today.set({ hour: endHour, minute: endMinute });

    return {
      timestamp: {
        $gte: from.toISO(),
        $lte: to.toISO(),
      },
    };
  }
}
