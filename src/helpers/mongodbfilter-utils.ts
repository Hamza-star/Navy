import { Injectable } from '@nestjs/common';

@Injectable()
export class MongoDateFilterService {
  getDateRangeFilter(range: string): { $gte: Date; $lte: Date } {
    const now = new Date();
    let from: Date;
    let to: Date = new Date(now);

    switch (range) {
      case 'today': {
        from = new Date(now);
        from.setHours(0, 0, 0, 0);

        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'yesterday': {
        from = new Date(now);
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);

        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'week': {
        const day = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
        const diffToMonday = day === 0 ? 6 : day - 1; // days to subtract to get Monday

        from = new Date(now);
        from.setDate(now.getDate() - diffToMonday);
        from.setHours(0, 0, 0, 0);

        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'lastWeek': {
        const day = now.getDay(); // Sunday = 0
        const diffToLastMonday = (day === 0 ? 7 : day - 1) + 7; // go back 7 + diff to Monday
        const diffToLastSunday = diffToLastMonday - 1; // then +6 days

        from = new Date(now);
        from.setDate(now.getDate() - diffToLastMonday);
        from.setHours(0, 0, 0, 0);

        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'month': {
        from = new Date(now);
        from.setMonth(now.getMonth());
        from.setDate(1);
        from.setHours(0, 0, 0, 0);

        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      }
      case 'lastMonth': {
        // First day of last month
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        from.setHours(0, 0, 0, 0);

        // Last day of last month
        to = new Date(now.getFullYear(), now.getMonth(), 0); // 0th = last day of previous month
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'year': {
        from = new Date(now.getFullYear(), 0, 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(now);
        to.setHours(23, 59, 59, 999);
        break;
      }
      case 'lastYear': {
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        to.setHours(23, 59, 59, 999);
        break;
      }
      default: {
        throw new Error(`Unsupported date range: ${range}`);
      }
    }

    return {
      $gte: from,
      $lte: to,
    };
  }

  getCustomDateRange(from: Date, to: Date): { $gte: Date; $lte: Date } {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  getSingleDateFilter(date: string | Date): { $gte: Date; $lte: Date } {
    let parsedDate: Date;

    if (typeof date === 'string') {
      const parts = date.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        parsedDate = new Date(year, month - 1, day);
      } else {
        parsedDate = new Date(date); // fallback
      }
    } else {
      parsedDate = new Date(date);
    }

    const start = new Date(parsedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(parsedDate);
    end.setHours(23, 59, 59, 999);

    return { $gte: start, $lte: end };
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
                $add: [
                  { $multiply: [{ $hour: '$timestamp' }, 3600] },
                  { $multiply: [{ $minute: '$timestamp' }, 60] },
                  { $second: '$timestamp' },
                ],
              },
              startSec,
            ],
          },
          {
            $lte: [
              {
                $add: [
                  { $multiply: [{ $hour: '$timestamp' }, 3600] },
                  { $multiply: [{ $minute: '$timestamp' }, 60] },
                  { $second: '$timestamp' },
                ],
              },
              endSec,
            ],
          },
        ],
      },
    };
  }
  
}
