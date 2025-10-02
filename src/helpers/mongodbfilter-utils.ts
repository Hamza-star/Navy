// // mongo-date-filter.service.ts
// import { Injectable } from '@nestjs/common';
// import { DateTime } from 'luxon';
// @Injectable()
// export class MongoDateFilterService {
//   private toISOStringStart(date: Date): string {
//     const d = new Date(date);
//     //d.setHours(0, 0, 0, 0);
//     return d.toISOString();
//   }

//   private toISOStringEnd(date: Date): string {
//     const d = new Date(date);
//     //d.setHours(23, 59, 59, 999);
//     return d.toISOString();
//   }

//   getDateRangeFilter(range: string): { $gte: string; $lte: string } {
//     const tz = 'Asia/Karachi';
//     const now = DateTime.now().setZone(tz);

//     let from: DateTime;
//     let to: DateTime;

//     switch (range) {
//       case 'today': {
//         from = now.startOf('day');
//         to = now.endOf('day');
//         break;
//       }
//       case 'yesterday': {
//         from = now.minus({ days: 1 }).startOf('day');
//         to = now.minus({ days: 1 }).endOf('day');
//         break;
//       }
//       case 'week': {
//         from = now.startOf('week'); // Luxon uses Monday as start
//         to = now.endOf('week');
//         break;
//       }
//       case 'lastWeek': {
//         from = now.minus({ weeks: 1 }).startOf('week');
//         to = now.minus({ weeks: 1 }).endOf('week');
//         break;
//       }
//       case 'month': {
//         from = now.startOf('month');
//         to = now.endOf('month');
//         break;
//       }
//       case 'lastMonth': {
//         from = now.minus({ months: 1 }).startOf('month');
//         to = now.minus({ months: 1 }).endOf('month');
//         break;
//       }
//       case 'year': {
//         from = now.startOf('year');
//         to = now.endOf('year');
//         break;
//       }
//       case 'lastYear': {
//         from = now.minus({ years: 1 }).startOf('year');
//         to = now.minus({ years: 1 }).endOf('year');
//         break;
//       }
//       default: {
//         throw new Error(`Unsupported date range: ${range}`);
//       }
//     }

//     console.log(`[DEBUG] getDateRangeFilter(${range})`);
//     console.log(
//       '  From (Asia/Karachi):',
//       from.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
//     );
//     console.log(
//       '  To   (Asia/Karachi):',
//       to.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ'),
//     );

//     return {
//       $gte: from.toISO(), // ISO string with offset, e.g. 2025-08-16T00:00:00.000+05:00
//       $lte: to.toISO(), // same with +05:00
//     };
//   }

//   // getCustomDateRange(from: Date, to: Date): { $gte: string; $lte: string } {
//   //   return {
//   //     $gte: this.toISOStringStart(from),
//   //     $lte: this.toISOStringEnd(to),
//   //   };
//   // }

//   // ======================== DATE FILTER HELPERS ========================

//   // Mongo Date Range helper
//   getCustomDateRange(from: Date, to: Date): { $gte: string; $lte: string } {
//     return {
//       $gte: from.toISOString(),
//       $lte: to.toISOString(),
//     };
//   }

//   getSingleDateFilter(date: string | Date): { $gte: string; $lte: string } {
//     let parsedDate: Date;

//     if (typeof date === 'string') {
//       parsedDate = new Date(date);
//     } else {
//       parsedDate = date;
//     }

//     return {
//       $gte: this.toISOStringStart(parsedDate),
//       $lte: this.toISOStringEnd(parsedDate),
//     };
//   }

//   getCustomTimeRange(startTime: string, endTime: string): { $expr: object } {
//     const parseTime = (t: string): number => {
//       const [h, m, s] = t.split(':').map((n) => parseInt(n, 10));
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
//                 $let: {
//                   vars: {
//                     timeStr: { $substr: ['$timestamp', 11, 8] }, // "HH:MM:SS"
//                     parts: {
//                       $map: {
//                         input: {
//                           $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                         },
//                         as: 'part',
//                         in: { $toInt: '$$part' },
//                       },
//                     },
//                   },
//                   in: {
//                     $add: [
//                       { $multiply: [{ $arrayElemAt: ['$$parts', 0] }, 3600] },
//                       { $multiply: [{ $arrayElemAt: ['$$parts', 1] }, 60] },
//                       { $arrayElemAt: ['$$parts', 2] },
//                     ],
//                   },
//                 },
//               },
//               startSec,
//             ],
//           },
//           {
//             $lte: [
//               {
//                 $let: {
//                   vars: {
//                     timeStr: { $substr: ['$timestamp', 11, 8] },
//                     parts: {
//                       $map: {
//                         input: {
//                           $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
//                         },
//                         as: 'part',
//                         in: { $toInt: '$$part' },
//                       },
//                     },
//                   },
//                   in: {
//                     $add: [
//                       { $multiply: [{ $arrayElemAt: ['$$parts', 0] }, 3600] },
//                       { $multiply: [{ $arrayElemAt: ['$$parts', 1] }, 60] },
//                       { $arrayElemAt: ['$$parts', 2] },
//                     ],
//                   },
//                 },
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
export class MongoDateFilterService {
  private tz = 'Asia/Karachi';

  private toISOStringStart(date: Date): string {
    return DateTime.fromJSDate(date, { zone: this.tz })
      .startOf('second')
      .toISO(); // ✅ Will keep +05:00 instead of Z
  }

  private toISOStringEnd(date: Date): string {
    return DateTime.fromJSDate(date, { zone: this.tz }).endOf('second').toISO(); // ✅ Keeps offset
  }

  getDateRangeFilter(range: string): { $gte: string; $lte: string } {
    const now = DateTime.now().setZone(this.tz);

    let from: DateTime;
    let to: DateTime;

    switch (range) {
      case 'today':
        from = now.startOf('day');
        to = now.endOf('day');
        break;
      case 'yesterday':
        from = now.minus({ days: 1 }).startOf('day');
        to = now.minus({ days: 1 }).endOf('day');
        break;
      case 'week':
        from = now.startOf('week');
        to = now.endOf('week');
        break;
      case 'lastWeek':
        from = now.minus({ weeks: 1 }).startOf('week');
        to = now.minus({ weeks: 1 }).endOf('week');
        break;
      case 'month':
        from = now.startOf('month');
        to = now.endOf('month');
        break;
      case 'lastMonth':
        from = now.minus({ months: 1 }).startOf('month');
        to = now.minus({ months: 1 }).endOf('month');
        break;
      case 'year':
        from = now.startOf('year');
        to = now.endOf('year');
        break;
      case 'lastYear':
        from = now.minus({ years: 1 }).startOf('year');
        to = now.minus({ years: 1 }).endOf('year');
        break;
      default:
        throw new Error(`Unsupported date range: ${range}`);
    }

    return {
      $gte: from.toISO(),
      $lte: to.toISO(),
    };
  }

  getCustomDateRange(from: Date, to: Date): { $gte: string; $lte: string } {
    return {
      $gte: this.toISOStringStart(from),
      $lte: this.toISOStringEnd(to),
    };
  }

  getSingleDateFilter(date: string | Date): { $gte: string; $lte: string } {
    const parsedDate =
      typeof date === 'string' ? new Date(date) : (date as Date);

    return {
      $gte: this.toISOStringStart(parsedDate),
      $lte: this.toISOStringEnd(parsedDate),
    };
  }

  getCustomTimeRange(startTime: string, endTime: string): { $expr: object } {
    const parseTime = (t: string): number => {
      const [h, m, s] = t.split(':').map((n) => parseInt(n, 10));
      return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
    };

    const startSec = parseTime(startTime);
    const endSec = parseTime(endTime);

    return {
      $expr: {
        $and: [
          {
            $gte: [
              {
                $let: {
                  vars: {
                    parts: {
                      $map: {
                        input: {
                          $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
                        },
                        as: 'part',
                        in: { $toInt: '$$part' },
                      },
                    },
                  },
                  in: {
                    $add: [
                      { $multiply: [{ $arrayElemAt: ['$$parts', 0] }, 3600] },
                      { $multiply: [{ $arrayElemAt: ['$$parts', 1] }, 60] },
                      { $arrayElemAt: ['$$parts', 2] },
                    ],
                  },
                },
              },
              startSec,
            ],
          },
          {
            $lte: [
              {
                $let: {
                  vars: {
                    parts: {
                      $map: {
                        input: {
                          $split: [{ $substr: ['$timestamp', 11, 8] }, ':'],
                        },
                        as: 'part',
                        in: { $toInt: '$$part' },
                      },
                    },
                  },
                  in: {
                    $add: [
                      { $multiply: [{ $arrayElemAt: ['$$parts', 0] }, 3600] },
                      { $multiply: [{ $arrayElemAt: ['$$parts', 1] }, 60] },
                      { $arrayElemAt: ['$$parts', 2] },
                    ],
                  },
                },
              },
              endSec,
            ],
          },
        ],
      },
    };
  }
}
