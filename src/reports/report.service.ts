/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reports } from './schemas/reports.schema';
import { ReportsDto } from './dto/reports.dto';
import * as moment from 'moment-timezone';

@Injectable()
export class ReportsService {
  constructor(@InjectModel(Reports.name) private usageModel: Model<Reports>) {}

  async getReports() {
    // const { start_date, end_date, start_time, end_time, CoolingTower, reportType } =
    //   dto;
    // const suffixArray = suffixes || [];

    // Default time range for the day
    // const defaultStartTime = start_time || '00:00:00.000';
    // const defaultEndTime = end_time || '23:59:59.999';

    // const results: any[] = [];

    // const current = moment.tz(
    //   `${start_date} ${defaultStartTime}`,
    //   'YYYY-MM-DD HH:mm:ss.SSS',
    //   'Asia/Karachi',
    // );
    // const endDateMoment = moment.tz(
    //   `${end_date} ${defaultEndTime}`,
    //   'YYYY-MM-DD HH:mm:ss.SSS',
    //   'Asia/Karachi',
    // );


    return "logic need to be created first";
  }
}
