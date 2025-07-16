import { Injectable } from '@nestjs/common';

@Injectable()
export class DateUtilsService {
  isDateWithinRange(input: string | Date, start: Date, end: Date): boolean {
    const d = new Date(input);
    return d >= start && d <= end;
  }

  isTimeWithinRange(
    input: string | Date,
    startTime: string,
    endTime: string,
  ): boolean {
    const date = new Date(input);
    const seconds =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

    const parse = (str: string) => {
      const [h, m, s = '0'] = str.split(':');
      return +h * 3600 + +m * 60 + +s;
    };

    const startSec = parse(startTime);
    const endSec = parse(endTime);

    return seconds >= startSec && seconds <= endSec;
  }

  isDateTimeWithinRange(
    input: string | Date,
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string,
  ): boolean {
    const ts = new Date(input);

    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);

    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);

    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);

    if (!(d.getTime() >= s.getTime() && d.getTime() <= e.getTime())) {
      return false;
    }

    const secondsOfDay =
      ts.getHours() * 3600 + ts.getMinutes() * 60 + ts.getSeconds();

    const parse = (str: string) => {
      const parts = str.split(':').map(Number);
      const [h, m, s = 0] = parts;
      return h * 3600 + m * 60 + s;
    };

    const startSec = parse(startTime);
    const endSec = parse(endTime);

    return secondsOfDay >= startSec && secondsOfDay <= endSec;
  }

  isToday(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    return (
      inputDate.getDate() === today.getDate() &&
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getFullYear() === today.getFullYear()
    );
  }

  // 2. Yesterday (previous day)
  isYesterday(input: string | Date): boolean {
    const inputDate = new Date(input);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      inputDate.getDate() === yesterday.getDate() &&
      inputDate.getMonth() === yesterday.getMonth() &&
      inputDate.getFullYear() === yesterday.getFullYear()
    );
  }

  // 3. This Week (current week from Monday to Sunday)
  isThisWeek(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1),
    );
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return inputDate >= startOfWeek && inputDate <= endOfWeek;
  }

  // 4. Last Week (previous week)
  isLastWeek(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    // Get start of last week
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(
      today.getDate() - today.getDay() - 6 + (today.getDay() === 0 ? -6 : 1),
    );
    startOfLastWeek.setHours(0, 0, 0, 0);

    // Get end of last week
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    return inputDate >= startOfLastWeek && inputDate <= endOfLastWeek;
  }

  // 5. This Month (current month)
  isThisMonth(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    return (
      inputDate.getMonth() === today.getMonth() &&
      inputDate.getFullYear() === today.getFullYear()
    );
  }

  // 6. Last Month (previous month)
  isLastMonth(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    return (
      inputDate.getMonth() === lastMonth.getMonth() &&
      inputDate.getFullYear() === lastMonth.getFullYear()
    );
  }

  // 7. This Year (current year)
  isThisYear(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    return inputDate.getFullYear() === today.getFullYear();
  }

  // 8. Last Year (previous year)
  isLastYear(input: string | Date): boolean {
    const inputDate = new Date(input);
    const today = new Date();

    return inputDate.getFullYear() === today.getFullYear() - 1;
  }
}
