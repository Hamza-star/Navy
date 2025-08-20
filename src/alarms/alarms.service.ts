import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAlarmDto } from './dto/alarms.dto';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { Alarms } from './schema/alarms.schema';
import { AlarmRulesSet } from './schema/alarmsTriggerConfig.schema';
import { AlarmsType } from './schema/alarmsType.schema';
@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(AlarmsType.name) private alarmTypeModel: Model<AlarmsType>,
    @InjectModel(Alarms.name) private alarmsModel: Model<Alarms>,
    @InjectModel(AlarmRulesSet.name)
    private alarmsRulesSetModel: Model<AlarmRulesSet>,
  ) {}

  private readonly intervalsSec = [5, 15, 30, 60, 120];
  private readonly Time = [1, 2, 3, 4, 5];

  getIntervals(): number[] {
    return this.intervalsSec;
  }

  getTime(): number[] {
    return this.Time;
  }

  async addAlarmType(dto: AlarmsTypeDto) {
    const alarmType = new this.alarmTypeModel(dto);
    await alarmType.save();

    return {
      message: 'Alarm Type added successfully',
      data: alarmType,
    };
  }

  async getAllAlarmTypes() {
    return this.alarmTypeModel.find().exec();
  }

  // Update by ID
  async updateAlarmType(id: string, dto: AlarmsTypeDto) {
    const updated = await this.alarmTypeModel.findByIdAndUpdate(id, dto, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      throw new NotFoundException(`Alarm Type with ID ${id} not found`);
    }

    return {
      message: 'Alarm Type updated successfully',
      data: updated,
    };
  }

  // Delete by ID
  async deleteAlarmType(id: string) {
    // 1. Check if alarm type exists
    const alarmType = await this.alarmTypeModel.findById(id);
    if (!alarmType) {
      throw new NotFoundException(`Alarm Type with ID ${id} not found`);
    }

    console.log('alarms with type');
    // 2. Check if any alarms reference this alarmType
    const alarmsWithType = await this.alarmsModel.findOne({ alarmTypeId: id });
    if (alarmsWithType) {
      return {
        message: `Cannot delete: alarms exist with this alarm type.`,
        data: null,
      };
    }

    // 3. Delete if safe
    const deleted = await this.alarmTypeModel.findByIdAndDelete(id);

    return {
      message: 'Alarm Type deleted successfully',
      data: deleted,
    };
  }

  async addAlarm(dto: CreateAlarmDto) {
    // 1️⃣ Save ruleset separately
    const ruleset = new this.alarmsRulesSetModel(dto.alarmTriggerConfig);
    await ruleset.save();

    // 2️⃣ Create alarm with correct ObjectIds
    const alarm = new this.alarmsModel({
      ...dto,
      alarmTypeId: new Types.ObjectId(dto.alarmTypeId), // ✅ force ObjectId
      alarmTriggerConfig: ruleset._id, // ✅ ObjectId from saved ruleset
    });

    await alarm.save();

    return {
      message: 'Alarm added successfully',
      data: alarm,
    };
  }

  async getAlarmsByType(alarmTypeId: string): Promise<{
    message: string;
    data: (Alarms & {
      alarmTypeId: AlarmsType;
      alarmTriggerConfig: AlarmRulesSet;
    })[];
  }> {
    const alarms = await this.alarmsModel
      .find({ alarmTypeId: new Types.ObjectId(alarmTypeId) })
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .populate<{ alarmTriggerConfig: AlarmRulesSet }>('alarmTriggerConfig')
      .lean()
      .exec();

    if (!alarms || alarms.length === 0) {
      throw new NotFoundException(`No alarms found for typeId ${alarmTypeId}`);
    }

    return {
      message: 'Alarms fetched successfully',
      data: alarms as unknown as (Alarms & {
        alarmTypeId: AlarmsType;
        alarmTriggerConfig: AlarmRulesSet;
      })[],
    };
  }

  async getAlarmTypeByAlarmId(
    alarmId: string,
  ): Promise<{ message: string; data: AlarmsType }> {
    const alarm = await this.alarmsModel
      .findById(alarmId)
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .lean()
      .exec();

    if (!alarm) {
      throw new NotFoundException(`Alarm with ID ${alarmId} not found`);
    }

    if (!alarm.alarmTypeId) {
      throw new NotFoundException(`AlarmType not found for alarmId ${alarmId}`);
    }

    return {
      message: 'AlarmType fetched successfully',
      data: alarm.alarmTypeId as AlarmsType,
    };
  }
}
