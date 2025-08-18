import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AlarmsType } from './schema/alarmsType.schema';
import { AlarmsTypeDto } from './dto/alarmsType.dto';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(AlarmsType.name) private alarmTypeModel: Model<AlarmsType>,
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
}
