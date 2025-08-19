import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlarmsType } from './schema/alarmsType.schema';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { CreateAlarmDto } from './dto/alarms.dto';
import { Alarms } from './schema/alarms.schema';
import { AlarmRulesSet } from './schema/alarmsTriggerConfig.schema';
import { AlarmTriggerConfigDto } from './dto/alarmsTriggerConfig.dto';
@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(AlarmsType.name) private alarmTypeModel: Model<AlarmsType>,
    @InjectModel(Alarms.name) private alarmsModel: Model<Alarms>,
    @InjectModel(AlarmRulesSet.name)
    private alarmsRulesSetModel: Model<AlarmRulesSet>,
  ) {}

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
    const deleted = await this.alarmTypeModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException(`Alarm Type with ID ${id} not found`);
    }

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
}
