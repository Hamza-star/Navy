// mongo-date-filter.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class MongoDateFilterService {
  private toISOStringStart(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private toISOStringEnd(date: Date): string {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  getDateRangeFilter(range: string): { $gte: string; $lte: string } {
    const now = new Date();
    let from: Date;
    let to: Date = new Date(now);

    switch (range) {
      case 'today': {
        from = new Date(now);
        break;
      }
      case 'yesterday': {
        from = new Date(now);
        from.setDate(from.getDate() - 1);
        to = new Date(from);
        break;
      }
      case 'week': {
        const day = now.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;
        from = new Date(now);
        from.setDate(now.getDate() - diffToMonday);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        break;
      }
      case 'lastWeek': {
        const day = now.getDay();
        const diffToLastMonday = (day === 0 ? 7 : day - 1) + 7;
        from = new Date(now);
        from.setDate(now.getDate() - diffToLastMonday);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        break;
      }
      case 'month': {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
      case 'lastMonth': {
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'year': {
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      }
      case 'lastYear': {
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      }
      default: {
        throw new Error(`Unsupported date range: ${range}`);
      }
    }

    return {
      $gte: this.toISOStringStart(from),
      $lte: this.toISOStringEnd(to),
    };
  }

  getCustomDateRange(from: Date, to: Date): { $gte: string; $lte: string } {
    return {
      $gte: this.toISOStringStart(from),
      $lte: this.toISOStringEnd(to),
    };
  }

  getSingleDateFilter(date: string | Date): { $gte: string; $lte: string } {
    let parsedDate: Date;

    if (typeof date === 'string') {
      parsedDate = new Date(date);
    } else {
      parsedDate = date;
    }

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