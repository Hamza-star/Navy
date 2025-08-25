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
import { AlarmRulesSet } from './schema/alarmsTriggerConfig.schema';
import { AlarmsType } from './schema/alarmsType.schema';
import { Alarms, AlarmsDocument } from './schema/alarmsModel.schema';
import {
  AlarmOccurrence,
  AlarmsOccurrenceDocument,
} from './schema/alarmOccurences.schema';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
    // If missing in DTO, preserve existing

    // 4️⃣ Handle alarmTriggerConfig
    if (alarmTriggerConfig) {
      if (typeof alarmTriggerConfig === 'object') {
        if (
          alarmTriggerConfig._id &&
          Types.ObjectId.isValid(alarmTriggerConfig._id)
        ) {
          // Update existing ruleset
          await this.alarmsRulesSetModel.findByIdAndUpdate(
            alarmTriggerConfig._id,
            alarmTriggerConfig,
          );
          updateData.alarmTriggerConfig = new Types.ObjectId(
            alarmTriggerConfig._id,
          );
        } else {
          // Create new ruleset
          const ruleset = new this.alarmsRulesSetModel(alarmTriggerConfig);
          await ruleset.save();
          updateData.alarmTriggerConfig = ruleset._id;
        }
      } else if (Types.ObjectId.isValid(alarmTriggerConfig)) {
        updateData.alarmTriggerConfig = new Types.ObjectId(alarmTriggerConfig);
      } else {
        throw new BadRequestException('Invalid alarmTriggerConfig');
      }
    }
    // If missing in DTO, preserve existing

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
  private getTriggeredThreshold(value: number, rules: AlarmRulesSet) {
    if (!rules?.thresholds?.length) return undefined;
    return rules.thresholds.find((t) =>
      this.evaluateCondition(value, t.operator, t.value),
    );
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
  ) {
    const now = new Date();
    const configId =
      alarmConfig && typeof alarmConfig === 'object'
        ? ((alarmConfig as { _id?: unknown; alarmConfigId?: unknown })._id ??
          (alarmConfig as { alarmConfigId?: unknown }).alarmConfigId)
        : undefined;

    const event = await this.alarmsEventModel
      .findOne({ alarmConfigId: configId, alarmStatus: true })
      .exec();

    const triggered = this.getTriggeredThreshold(value, rules);

    const occurrence = await this.alarmOccurrenceModel.create({
      date: now,
      alarmID: `ALM_${configId?.toString?.() ?? 'cfg'}_${now.getTime()}`,
      alarmStatus: true,
      alarmThresholdId:
        triggered && typeof triggered === 'object' && '_id' in triggered
          ? (triggered._id as Types.ObjectId)
          : null,
      alarmThresholdValue: triggered?.value ?? null,
      alarmThresholdOperator: (triggered?.operator as any) ?? null,
      alarmPresentValue: value,
      alarmAcknowledgeStatus: 'Unacknowledged',
      alarmAcknowledgmentAction: '',
      alarmAcknowledgedBy: '',
      alarmAcknowledgedDelay: 0,
      alarmAge: 0,
      alarmDuration: 0,
    });

    if (event) {
      event.alarmOccurrenceCount = (event.alarmOccurrenceCount || 0) + 1;
      event.alarmLastOccurrence = now;
      event.alarmOccurrences.push(occurrence._id as Types.ObjectId);
      await event.save();
      return { event, occurrence }; // ✅ return both
    }

    const created = new this.alarmsEventModel({
      alarmID: `${configId?.toString?.() ?? 'cfg'}_${now.getTime()}`,
      alarmConfigId: configId,
      alarmTimestamp: now,
      alarmStatus: true,
      alarmOccurrenceCount: 1,
      alarmFirstOccurrence: now,
      alarmLastOccurrence: now,
      alarmOccurrences: [occurrence._id],
      alarmAcknowledgeStatus: 'Unacknowledged',
      alarmAcknowledgmentAction: '',
    });

    await created.save();
    return { event: created, occurrence }; // ✅ return both
  }

  /**
   * Deactivate any currently active alarm events whose config IDs are not in the provided set.
   */
  private async deactivateResolvedAlarms(activeConfigIds: Set<string>) {
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
    const url = 'http://13.234.241.103:1880/ifl_realtime';
    const resp = await firstValueFrom(this.httpService.get(url));
    const data: unknown = resp.data;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException('No data from Node-RED');
    }

    const payload: Record<string, unknown> = data as Record<string, unknown>;
    console.log(
      '✅ Payload received from Node-RED:',
      Object.keys(payload).slice(0, 10),
      '... total:',
      Object.keys(payload).length,
    );

    const alarms = (await this.alarmsModel
      .find()
      .populate('alarmTriggerConfig')
      .populate('alarmTypeId')
      .exec()) as AlarmConfigWithPopulate[];
    console.log('✅ Loaded alarms from DB:', alarms.length);

    const triggeredAlarms: Array<{
      alarmName: string;
      device: string;
      parameter: string;
      value: number;
      threshold: any[];
      alarmType?: any;
      alarmTypeName?: string | null;
      triggeredAt?: Date; // ✅ add timestamp here
    }> = [];

    const activeConfigIds = new Set<string>();

    for (const alarm of alarms) {
      const { alarmDevice, alarmParameter } = alarm;
      console.log(
        `\n🔎 Checking alarm: ${alarm.alarmName} (Device=${alarmDevice}, Param=${alarmParameter}),`,
      );

      const prefix =
        `${(alarm.alarmSubLocation || '').toString()}_${(alarm.alarmDevice || '').toString()}`.toLowerCase();
      const param = (alarm.alarmParameter || '').toString().toLowerCase();

      const key = Object.keys(payload).find((k) => {
        const kk = k.toString().toLowerCase();
        if (prefix && kk.startsWith(prefix) && param && kk.includes(param))
          return true;
        if (
          alarm.alarmDevice &&
          kk.includes(alarm.alarmDevice.toString().toLowerCase()) &&
          param &&
          kk.includes(param)
        )
          return true;
        return false;
      });

      console.log(
        ' ➡ Matching key found:',
        key,
        '(prefix:',
        prefix,
        'param:',
        param,
        ')',
      );

      if (!key) continue;

      const valueRaw = payload[key];
      const value = typeof valueRaw === 'number' ? valueRaw : Number(valueRaw);
      console.log(` ➡ Payload value: ${value}`);

      if ('thresholds' in alarm.alarmTriggerConfig) {
        const rules = alarm.alarmTriggerConfig as AlarmRulesSet;
        console.log(' ➡ Rules:', rules.thresholds);
        const isTriggered = this.evaluateRules(value, rules);
        console.log(' ⚡ Rule evaluation result:', isTriggered);

        if (isTriggered) {
          try {
            const { event, occurrence } = await this.upsertTriggeredAlarm(
              alarm,
              rules,
              value,
            );
            activeConfigIds.add(alarm._id.toString());
            triggeredAlarms.push({
              alarmName: alarm.alarmName,
              device: alarmDevice,
              parameter: alarmParameter,
              value,
              threshold: rules.thresholds,
              alarmType: alarm.alarmTypeId || null,
              alarmTypeName: alarm.alarmTypeId?.type ?? null,
              triggeredAt: occurrence.date, // ✅ exact DB timestamp
            });
            console.log(' 🚨 Alarm TRIGGERED!');
            console.log(' 💾 Alarm event upserted:', event._id?.toString?.());
          } catch (err) {
            console.error(
              ' ⚠ Failed to upsert alarm event:',
              err?.message ?? err,
            );
          }
        }
      } else {
        console.log(' ⚠ No thresholds in alarmTriggerConfig');
      }
    }

    try {
      await this.deactivateResolvedAlarms(activeConfigIds);
    } catch (err) {
      console.error(
        'Failed to deactivate resolved alarms:',
        err?.message ?? err,
      );
    }

    console.log('\n✅ Final triggered alarms:', triggeredAlarms.length);
    return triggeredAlarms;
  }
}
