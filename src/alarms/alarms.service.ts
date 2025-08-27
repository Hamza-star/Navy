/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigAlarmDto } from './dto/alarmsConfig.dto';
import { AlarmsTypeDto } from './dto/alarmsType.dto';
import { alarmsConfiguration } from './schema/alarmsConfig.schema';
import {
  AlarmRulesSet,
  AlarmRulesSetDocument,
  ThresholdCondition,
} from './schema/alarmsTriggerConfig.schema';
import { AlarmsType } from './schema/alarmsType.schema';
import { Alarms, AlarmsDocument } from './schema/alarmsModel.schema';
import {
  AlarmOccurrence,
  AlarmsOccurrenceDocument,
} from './schema/alarmOccurences.schema';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { getTimeRange, TimeRangePayload } from 'src/helpers/generalTimeFilter';
// Local type to represent an alarm config document with populated refs
// (keeps this file lightweight rather than changing global schema types)
type AlarmConfigWithPopulate = alarmsConfiguration & {
  _id?: any;
  alarmTriggerConfig?: AlarmRulesSet | null;
  alarmTypeId?: Partial<AlarmsType> | null;
};
@Injectable()
export class AlarmsService {
  constructor(
    @InjectModel(AlarmsType.name) private alarmTypeModel: Model<AlarmsType>,
    @InjectModel(alarmsConfiguration.name)
    private alarmsModel: Model<alarmsConfiguration>,
    @InjectModel(AlarmRulesSet.name)
    private alarmsRulesSetModel: Model<AlarmRulesSet>,
    @InjectModel(Alarms.name) private alarmsEventModel: Model<AlarmsDocument>,
    @InjectModel(AlarmOccurrence.name)
    private alarmOccurrenceModel: Model<AlarmsOccurrenceDocument>,
    private readonly httpService: HttpService,
  ) {}

  private readonly intervalsSec = [5, 15, 30, 60, 120];
  private readonly Time = [1, 2, 3, 4, 5];

  private meterSuffixMapping(): Record<string, string[]> {
    return {
      FM_01: ['FR', 'TOT'],
      FM_02: ['FR', 'TOT'],
      TEMP_RTD_01: ['AI'],
      TEMP_RTD_02: ['AI'],
      PT_01: ['AI'],
      INV_01_SPD: ['AI'],
      LLS_01: ['DI'],
      LS_01: ['DI'],
      VS_FAN_01: ['DI'],
      EM01: [
        'Voltage_AN_V',
        'Voltage_BN_V',
        'Voltage_CN_V',
        'Voltage_LN_V',
        'Voltage_AB_V',
        'Voltage_BC_V',
        'Voltage_CA_V',
        'Voltage_LL_V',
        'Current_AN_Amp',
        'Current_BN_Amp',
        'Current_CN_Amp',
        'Current_Total_Amp',
        'Frequency_Hz',
        'ActivePower_A_kW',
        'ActivePower_B_kW',
        'ActivePower_C_kW',
        'ActivePower_Total_kW',
        'ReactivePower_A_kVAR',
        'ReactivePower_B_kVAR',
        'ReactivePower_C_kVAR',
        'ReactivePower_Total_kVAR',
        'ApparentPower_A_kVA',
        'ApparentPower_B_kVA',
        'ApparentPower_C_kVA',
        'ApparentPower_Total_kVA',
        'ActiveEnergy_A_kWh',
        'ActiveEnergy_B_kWh',
        'ActiveEnergy_C_kWh',
        'ActiveEnergy_Total_kWh',
        'ActiveEnergy_A_Received_kWh',
        'ActiveEnergy_B_Received_kWh',
        'ActiveEnergy_C_Received_kWh',
        'ActiveEnergy_Total_Received_kWh',
        'ActiveEnergy_A_Delivered_kWh',
        'ActiveEnergy_B_Delivered_kWh',
        'ActiveEnergy_C_Delivered_kWh',
        'ActiveEnergy_Total_Delivered_kWh',
        'ApparentEnergy_A_kVAh',
        'ApparentEnergy_B_kVAh',
        'ApparentEnergy_C_kVAh',
        'ApparentEnergy_Total_kVAh',
        'ReactiveEnergy_A_kVARh',
        'ReactiveEnergy_B_kVARh',
        'ReactiveEnergy_C_kVARh',
        'ReactiveEnergy_Total_kVARh',
        'ReactiveEnergy_A_Inductive_kVARh',
        'ReactiveEnergy_B_Inductive_kVARh',
        'ReactiveEnergy_C_Inductive_kVARh',
        'ReactiveEnergy_Total_Inductive_kVARh',
        'ReactiveEnergy_A_Capacitive_kVARh',
        'ReactiveEnergy_B_Capacitive_kVARh',
        'ReactiveEnergy_C_Capacitive_kVARh',
        'ReactiveEnergy_Total_Capacitive_kVARh',
        'Harmonics_V1_THD',
        'Harmonics_V2_THD',
        'Harmonics_V3_THD',
        'Harmonics_I1_THD',
        'Harmonics_I2_THD',
        'Harmonics_I3_THD',
        'PowerFactor_A',
        'PowerFactor_B',
        'PowerFactor_C',
        'PowerFactor_Total',
      ],
      // Add more here as needed...
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async DevicesDropdownList() {
    const mapping = this.meterSuffixMapping();

    // Create dropdown-friendly format
    return Object.keys(mapping).map((meterId) => ({
      meterId,
      suffixes: mapping[meterId],
    }));
  }

  getMappedLocation(): Record<string, string[]> {
    return {
      Chillers: ['CHCT1', 'CHCT2'],
      Process: ['CT1', 'CT2'],
    };
  }

  async getAlarmsTypeName(): Promise<string[]> {
    const alarmsType = await this.alarmTypeModel
      .find({}, { type: 1, _id: 0 })
      .exec();
    return alarmsType.map((alarm) => alarm.type);
  }

  getIntervals(): number[] {
    return this.intervalsSec;
  }

  getTime(): number[] {
    return this.Time;
  }

  /**
   * Get the list of sub-locations.
   * @returns Array of sub-location strings.
   */

  /**
   * Add a new alarm type.
   * @param dto The data transfer object containing alarm type details.
   * @returns The created alarm type.
   */
  async addAlarmType(dto: AlarmsTypeDto) {
    const alarmType = new this.alarmTypeModel(dto);
    await alarmType.save();

    return {
      message: 'Alarm Type added successfully',
      data: alarmType,
    };
  }

  /**
   * Get all alarm types.
   * @returns Array of alarm types.
   */
  async getAllAlarmTypes() {
    return this.alarmTypeModel.find().exec();
  }

  /**
   * Update an existing alarm type.
   * @param id The ID of the alarm type to update.
   * @param dto The data transfer object containing updated alarm type details.
   * @returns The updated alarm type.
   */
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

  /**
   * Update an existing alarm.
   * @param dto The data transfer object containing updated alarm details.
   * @returns The updated alarm.
   */

  async updateAlarm(dto: UpdateAlarmDto) {
    const {
      alarmConfigId,
      alarmTriggerConfig,
      alarmTypeId,
      ...restUpdateData
    } = dto;

    // 1️⃣ Validate alarmConfigId
    if (!Types.ObjectId.isValid(alarmConfigId)) {
      throw new BadRequestException('Invalid alarmConfigId');
    }

    // 2️⃣ Fetch existing alarm
    const existingAlarm = await this.alarmsModel.findById(alarmConfigId);
    if (!existingAlarm) {
      throw new NotFoundException(`Alarm with ID ${alarmConfigId} not found`);
    }

    const updateData: any = { ...restUpdateData };

    // 3️⃣ Handle alarmTypeId
    if (alarmTypeId) {
      if (!Types.ObjectId.isValid(alarmTypeId)) {
        throw new BadRequestException('Invalid alarmTypeId');
      }
      updateData.alarmTypeId = new Types.ObjectId(alarmTypeId);
    }

    // 4️⃣ Handle alarmTriggerConfig (update existing instead of creating new)
    if (alarmTriggerConfig) {
      if (typeof alarmTriggerConfig === 'object') {
        // Pick _id from DTO or fallback to existing alarm's ruleset
        let rulesetId =
          alarmTriggerConfig._id?.toString() ??
          existingAlarm.alarmTriggerConfig?.toString();

        if (rulesetId && Types.ObjectId.isValid(rulesetId)) {
          const { thresholds, ...restRuleset } = alarmTriggerConfig;

          // Build update object
          const rulesetUpdate: any = { ...restRuleset };
          if (Array.isArray(thresholds)) {
            // overwrite thresholds instead of merging
            rulesetUpdate.thresholds = thresholds;
          }

          // Update existing ruleset
          await this.alarmsRulesSetModel.findByIdAndUpdate(
            rulesetId,
            { $set: rulesetUpdate },
            { new: true },
          );

          updateData.alarmTriggerConfig = new Types.ObjectId(rulesetId);
        } else {
          throw new BadRequestException(
            'No valid ruleset found for this alarmConfig',
          );
        }
      } else if (Types.ObjectId.isValid(alarmTriggerConfig)) {
        updateData.alarmTriggerConfig = new Types.ObjectId(alarmTriggerConfig);
      } else {
        throw new BadRequestException('Invalid alarmTriggerConfig');
      }
    }

    // 5️⃣ Perform update
    const updated = await this.alarmsModel
      .findByIdAndUpdate(alarmConfigId, { $set: updateData }, { new: true })
      .populate('alarmTypeId')
      .populate('alarmTriggerConfig')
      .lean();

    if (!updated) {
      throw new NotFoundException(
        `Alarm with ID ${alarmConfigId} could not be updated`,
      );
    }

    // 6️⃣ Ensure previous values are preserved in response if missing
    if (!updated.alarmTypeId) {
      updated.alarmTypeId = existingAlarm.alarmTypeId;
    }
    if (!updated.alarmTriggerConfig) {
      updated.alarmTriggerConfig = existingAlarm.alarmTriggerConfig;
    }

    return {
      message: 'Alarm updated successfully',
      data: updated,
    };
  }

  /**
   * Delete an existing alarm.
   * @param alarmConfigId The ID of the alarm to delete.
   * @returns A message indicating the result of the deletion.
   */

  async deleteAlarmByConfigId(alarmConfigId: string) {
    if (!Types.ObjectId.isValid(alarmConfigId)) {
      throw new BadRequestException('Invalid AlarmConfigId');
    }

    const objectId = new Types.ObjectId(alarmConfigId);

    const deleted = await this.alarmsModel.findByIdAndDelete(objectId).lean();

    if (!deleted) {
      throw new NotFoundException(`Alarm with ID ${alarmConfigId} not found`);
    }

    return {
      message: 'Alarm deleted successfully',
      data: deleted,
    };
  }

  /**
   * Delete an existing alarm type.
   * @param id The ID of the alarm type to delete.
   * @returns A message indicating the result of the deletion.
   */
  async deleteAlarmType(id: string) {
    const objectId = new Types.ObjectId(id);
    const relatedAlarms = await this.alarmsModel
      .find({ alarmTypeId: objectId })
      .select('alarmName')
      .lean();

    if (relatedAlarms.length > 0) {
      return {
        message: `Cannot delete AlarmType. It is used in ${relatedAlarms.length} alarms.`,
        count: relatedAlarms.length,
        alarms: relatedAlarms.map((a) => a.alarmName),
      };
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

  /**
   * Add a new alarm.
   * @param dto The data transfer object containing alarm details.
   * @returns The created alarm.
   */
  async addAlarm(dto: ConfigAlarmDto) {
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

  /**
   * Get alarms by type.
   * @param alarmTypeId The ID of the alarm type to retrieve alarms for.
   * @returns An object containing a message and the array of alarms.
   */
  async getAlarmsByType(alarmTypeId: string): Promise<{
    message: string;
    data: (alarmsConfiguration & {
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
      data: alarms as unknown as (alarmsConfiguration & {
        alarmTypeId: AlarmsType;
        alarmTriggerConfig: AlarmRulesSet;
      })[],
    };
  }

  /**
   * Get the alarm type associated with a specific alarm.
   * @param alarmId The ID of the alarm to retrieve the type for.
   * @returns An object containing a message and the alarm type.
   */
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

  private evaluateCondition(
    value: number,
    operator: string,
    threshold: number,
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  private evaluateRules(value: number, rules: AlarmRulesSet): boolean {
    if (!rules || !Array.isArray(rules.thresholds) || !rules.thresholds.length)
      return false;

    const results = rules.thresholds.map((rule) =>
      this.evaluateCondition(value, rule.operator, rule.value),
    );

    if (rules.conditionType === '&&') return results.every(Boolean);
    if (rules.conditionType === '||') return results.some(Boolean);
    return results[0] ?? false;
  }

  /**
   * Return the first threshold subdocument that matches the value (or undefined).
   */
  private getTriggeredThreshold(
    value: number,
    rules: AlarmRulesSet,
  ): ThresholdCondition | null {
    if (!rules || !rules.thresholds) return null;
    return (
      rules.thresholds.find((t) => {
        switch (t.operator) {
          case '>':
            return value > t.value;
          case '<':
            return value < t.value;
          case '>=':
            return value >= t.value;
          case '<=':
            return value <= t.value;
          case '==':
            return value === t.value;
          case '!=':
            return value !== t.value;
          default:
            return false;
        }
      }) ?? null
    );
  }

  private async generateCustomAlarmId(): Promise<string | null> {
    // Get last occurrence sorted by alarmID
    const last = await this.alarmOccurrenceModel
      .findOne({}, { alarmID: 1 })
      .sort({ createdAt: -1 })
      .lean();

    if (!last || !last.alarmID) {
      return 'ALM01-001'; // First ever alarm
    }

    const match = last.alarmID.match(/ALM(\d+)-(\d+)/);

    if (!match) {
      // agar purane format wali ID milti hai (ALM_configId_timestamp)
      // to phir se naya sequence shuru karo
      return 'ALM01-001';
    }

    const [, majorStr, minorStr] = match;
    let major = parseInt(majorStr, 10);
    let minor = parseInt(minorStr, 10);

    minor++;

    if (minor > 999) {
      minor = 1;
      major++;
    }

    if (major > 99) {
      return null; // 🚫 limit reached, no more alarms allowed
    }

    const newMajor = major.toString().padStart(2, '0');
    const newMinor = minor.toString().padStart(3, '0');

    return `ALM${newMajor}-${newMinor}`;
  }

  /**
   * Upsert an active alarm event for the given alarm configuration.
   * If an active event exists it will be updated (count, lastOccurrence, recentOccurrences).
   * Otherwise a new alarm event document will be created.
   */
  private async upsertTriggeredAlarm(
    alarmConfig: AlarmConfigWithPopulate,
    rules: AlarmRulesSet,
    value: number,
  ): Promise<{ event: any; occurrence: any } | null> {
    const now = new Date();
    const configId = alarmConfig._id;

    const event = await this.alarmsEventModel
      .findOne({ alarmConfigId: configId })
      .exec();

    const triggered = this.getTriggeredThreshold(value, rules);
    if (!triggered) return null;

    const customId = await this.generateCustomAlarmId();
    if (!customId) {
      throw new Error('Alarm ID limit reached (ALM99-999)');
    }

    const occurrence = await this.alarmOccurrenceModel.create({
      date: now,
      alarmID: customId,
      alarmStatus: true,
      alarmThresholdValue: triggered.value,
      alarmThresholdOperator: triggered.operator,
      alarmPresentValue: value,
      alarmAcknowledgeStatus: 'Unacknowledged',
      alarmAcknowledgmentAction: '',
      alarmAcknowledgedBy: '',
      alarmAcknowledgedDelay: 0,
      alarmAge: 0,
      alarmDuration: 0,
      alarmThreshold: triggered,
      alarmRulesetId: rules._id ?? undefined,
      alarmTypeId: alarmConfig.alarmTypeId?._id,
      alarmAcknowledgmentType: alarmConfig.alarmTypeId?.acknowledgeType,
    });

    if (event) {
      event.alarmOccurrenceCount = (event.alarmOccurrenceCount || 0) + 1;
      event.alarmLastOccurrence = now;
      event.alarmOccurrences.push(occurrence._id as Types.ObjectId);
      await event.save();
      return { event, occurrence };
    }

    const created = new this.alarmsEventModel({
      alarmConfigId: configId,
      alarmOccurrenceCount: 1,
      alarmFirstOccurrence: now,
      alarmLastOccurrence: now,
      alarmOccurrences: [occurrence._id],
    });

    await created.save();
    return { event: created, occurrence };
  }

  /**
   * Deactivate any currently active alarm events whose config IDs are not in the provided set.
   */
  async deactivateResolvedAlarms(activeConfigIds: Set<string>) {
    const now = new Date();

    const activeEvents = await this.alarmsEventModel
      .find({}) // no alarmStatus here
      .populate({
        path: 'alarmOccurrences',
        model: AlarmOccurrence.name,
        match: { alarmStatus: true }, // ✅ only pull active ones
      })
      .exec();

    for (const ev of activeEvents) {
      const cfgId = ev.alarmConfigId?.toString?.() ?? '';

      if (!activeConfigIds.has(cfgId)) {
        ev.alarmLastOccurrence = now;

        if (ev.alarmFirstOccurrence) {
          const durationSec = Math.floor(
            (now.getTime() - new Date(ev.alarmFirstOccurrence).getTime()) /
              1000,
          );

          if (ev.alarmOccurrences?.length) {
            const lastOccurrence =
              ev.alarmOccurrences[ev.alarmOccurrences.length - 1];
            const lastOccurrenceId = lastOccurrence._id ?? lastOccurrence; // handle both populated and non-populated cases

            try {
              await this.alarmOccurrenceModel.findByIdAndUpdate(
                lastOccurrenceId,
                {
                  alarmStatus: false,
                  alarmDuration: durationSec,
                },
              );
            } catch (err) {
              console.error(
                '⚠ Failed to update occurrence duration:',
                err?.message ?? err,
              );
            }
          }
        }

        await ev.save();
      }
    }
  }

  /**
   * Process active alarms by fetching real-time data and evaluating alarm conditions.
   * @returns An array of triggered alarm events.
   */
  async processActiveAlarms() {
    const resp = await firstValueFrom(
      this.httpService.get('http://13.234.241.103:1880/ifl_realtime'),
    );
    // const resp = {
    //   data: {
    //     CHCT1_EM01_Voltage_AN_V: 213,
    //   },
    // };
    const payload = resp.data as Record<string, unknown>;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new BadRequestException('No data from Node-RED');
    }

    const alarms = (await this.alarmsModel
      .find()
      .populate<{ alarmTriggerConfig: AlarmRulesSet }>('alarmTriggerConfig')
      .populate<{ alarmTypeId: AlarmsType }>('alarmTypeId')
      .exec()) as unknown as AlarmConfigWithPopulate[];

    const triggeredAlarms: Array<any> = [];
    const activeConfigIds = new Set<string>();

    for (const alarm of alarms) {
      const key = Object.keys(payload).find((k) => {
        const parts = k.split('_').map((p) => p.toLowerCase());

        return (
          parts[0] === alarm.alarmSubLocation.toLowerCase() && // exact sublocation match
          parts[1] === alarm.alarmDevice.toLowerCase() && // exact device match
          parts.slice(2).join('_') === alarm.alarmParameter.toLowerCase() // exact parameter match
        );
      });

      if (!key) continue;

      const value = Number(payload[key]);
      const rules = alarm.alarmTriggerConfig;
      if (!rules || !rules.thresholds?.length) continue;

      const triggered = this.getTriggeredThreshold(value, rules);
      if (!triggered) continue;

      const result = await this.upsertTriggeredAlarm(alarm, rules, value);
      if (!result) continue;

      const { event, occurrence } = result;
      activeConfigIds.add(alarm._id.toString());

      triggeredAlarms.push({
        alarmId: occurrence.alarmID,
        alarmName: alarm.alarmName,
        Location: alarm.alarmLocation,
        subLocation: alarm.alarmSubLocation,
        device: alarm.alarmDevice,
        parameter: alarm.alarmParameter,
        value,
        threshold: triggered,
        triggeredAt: occurrence.date,
        alarmType: alarm.alarmTypeId?.type,
        priority: alarm.alarmTypeId?.priority,
        color: alarm.alarmTypeId?.color,
        code: alarm.alarmTypeId?.code,
      });
    }

    await this.deactivateResolvedAlarms(activeConfigIds);

    return triggeredAlarms;
  }

  async gethistoricalAlarms(filters: any = {}) {
    const match: any = {};

    if (filters.alarmAcknowledgeStatus) {
      match['alarmOccurrences.alarmAcknowledgeStatus'] =
        filters.alarmAcknowledgeStatus;
    }

    if (filters.alarmStatus !== undefined) {
      match['alarmOccurrences.alarmStatus'] = filters.alarmStatus;
    }

    // Time range filter (range, from-to, date sab handle ho jaye)
    if (filters.range || filters.from || filters.to || filters.date) {
      const { start, end } = getTimeRange(filters as TimeRangePayload);

      match['alarmOccurrences.date'] = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const results = await this.alarmsEventModel.aggregate([
      // populate occurrences
      {
        $lookup: {
          from: 'alarmsOccurrence',
          localField: 'alarmOccurrences',
          foreignField: '_id',
          as: 'alarmOccurrences',
        },
      },

      // populate config
      {
        $lookup: {
          from: 'alarmsConfiguration',
          localField: 'alarmConfigId',
          foreignField: '_id',
          as: 'alarmConfigure',
        },
      },
      {
        $unwind: { path: '$alarmConfigure', preserveNullAndEmptyArrays: true },
      },

      // 🔥 populate alarmTypeId inside alarmConfigure
      {
        $lookup: {
          from: 'alarmsType', // 👈 your collection name for alarm types
          localField: 'alarmConfigure.alarmTypeId',
          foreignField: '_id',
          as: 'alarmConfigure.alarmType',
        },
      },
      {
        $unwind: {
          path: '$alarmConfigure.alarmType',
          preserveNullAndEmptyArrays: true,
        },
      },

      // unwind alarmOccurrences (mandatory for filtering)
      {
        $unwind: {
          path: '$alarmOccurrences',
          preserveNullAndEmptyArrays: false,
        },
      },

      // apply filters
      { $match: match },

      // regroup back to arrays
      {
        $group: {
          _id: '$_id',
          alarmConfigId: { $first: '$alarmConfigId' },
          alarmConfigure: { $first: '$alarmConfigure' },
          alarmOccurrenceCount: { $first: '$alarmOccurrenceCount' },
          alarmAcknowledgementStatusCount: {
            $first: '$alarmAcknowledgementStatusCount',
          },
          alarmFirstOccurrence: { $first: '$alarmFirstOccurrence' },
          alarmLastOccurrence: { $first: '$alarmLastOccurrence' },
          alarmOccurrences: { $push: '$alarmOccurrences' },
        },
      },
    ]);

    return {
      data: results,
      total: results.length,
    };
  }

  async acknowledgementActions() {
    const results = await this.alarmsModel.find(
      {}, // filter (sab documents)
      { acknowledgementActions: 1, _id: 0 }, // projection (sirf acknowledgementActions field)
    );
    const merged = results.flatMap((r) => r.acknowledgementActions || []);
    // merge all arrays into single array
    return [...new Set(merged)]; // return unique values only
  }

  async acknowledgeOne(
    occurrenceId: string,
    action: string,
    acknowledgedBy: string, // frontend still passes string id
  ) {
    const occurrence = await this.alarmOccurrenceModel.findById(occurrenceId);
    if (!occurrence) throw new NotFoundException('Occurrence not found');

    if (occurrence.alarmAcknowledgeStatus === 'Acknowledged') {
      throw new Error('This occurrence is already acknowledged');
    }

    const now = new Date();
    const delay = (now.getTime() - new Date(occurrence.date).getTime()) / 1000;

    // ✅ Update occurrence
    occurrence.alarmAcknowledgeStatus = 'Acknowledged';
    occurrence.alarmAcknowledgmentAction = action;

    // 👇 Cast to ObjectId safely
    occurrence.alarmAcknowledgedBy = new Types.ObjectId(acknowledgedBy);

    occurrence.alarmAcknowledgedDelay = delay;

    await occurrence.save();

    // ✅ Find parent AlarmEvent that has this occurrence
    const parentAlarm = await this.alarmsEventModel.findOne({
      alarmOccurrences: occurrence._id,
    });

    if (parentAlarm) {
      // Count acknowledged occurrences
      const acknowledgedCount = await this.alarmOccurrenceModel.countDocuments({
        _id: { $in: parentAlarm.alarmOccurrences },
        alarmAcknowledgeStatus: 'Acknowledged',
      });

      parentAlarm.alarmAcknowledgementStatusCount = acknowledgedCount;
      await parentAlarm.save();
    }
  }
  /**
   * Acknowledge multiple occurrences at once
   */
  async acknowledgeMany(occurrenceIds: string[], acknowledgedBy: string) {
    const now = new Date();

    // ✅ Cast all IDs to ObjectId
    const objectIds = occurrenceIds.map((id) => new Types.ObjectId(id));

    // ✅ Update occurrences in bulk
    await this.alarmOccurrenceModel.updateMany(
      {
        _id: { $in: objectIds },
        alarmAcknowledgeStatus: { $ne: 'Acknowledged' },
      },
      {
        $set: {
          alarmAcknowledgeStatus: 'Acknowledged',
          alarmAcknowledgmentAction: 'Auto Mass Acknowledged',
          alarmAcknowledgedBy: new Types.ObjectId(acknowledgedBy),
          alarmAcknowledgedDelay: 0, // you could calculate per-occurrence if needed
        },
      },
    );

    // ✅ Get all parent alarms that have these occurrences
    const occurrences = await this.alarmOccurrenceModel.find({
      _id: { $in: objectIds },
    });

    // Find unique parent alarms
    const parentAlarms = await this.alarmsEventModel.find({
      alarmOccurrences: { $in: objectIds },
    });

    for (const parentAlarm of parentAlarms) {
      // Recalculate acknowledged count for this parent
      const acknowledgedCount = await this.alarmOccurrenceModel.countDocuments({
        _id: { $in: parentAlarm.alarmOccurrences },
        alarmAcknowledgeStatus: 'Acknowledged',
      });

      parentAlarm.alarmAcknowledgementStatusCount = acknowledgedCount;
      await parentAlarm.save();
    }

    return { updated: objectIds.length };
  }
}
