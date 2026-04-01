import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CalorieEntry,
  CalorieEntryDocument,
  CalorieType,
} from './schemas/calorie-entry.schema';
import { CreateCalorieEntryDto } from './dto/create-calorie-entry.dto';
import { UpdateCalorieEntryDto } from './dto/update-calorie-entry.dto';
import { QueryCalorieEntryDto } from './dto/query-calorie-entry.dto';
import { QueryDailySummaryDto } from './dto/query-daily-summary.dto';

@Injectable()
export class CalorieService {
  constructor(
    @InjectModel(CalorieEntry.name)
    private calorieModel: Model<CalorieEntryDocument>,
  ) {}

  /**
   * @description 创建或更新卡路里条目（有 externalId 时基于 userId + externalId 去重）
   * @param userId 当前用户 ID
   * @param dto 创建参数
   * @returns { data: 条目数据, isNew: 是否为新建 }
   */
  async create(userId: string, dto: CreateCalorieEntryDto) {
    if (dto.externalId) {
      const result = await this.calorieModel.findOneAndUpdate(
        { userId, externalId: dto.externalId },
        { $set: { ...dto, userId } },
        { new: true, upsert: true, includeResultMetadata: true },
      );
      return {
        data: result.value,
        isNew: !!result.lastErrorObject?.upserted,
      };
    }

    const data = await this.calorieModel.create({ ...dto, userId });
    return { data, isNew: true };
  }

  /**
   * @description 分页查询卡路里条目列表
   * @param userId 当前用户 ID
   * @param query 分页与筛选参数
   * @returns { data, total }
   */
  async findAll(userId: string, query: QueryCalorieEntryDto) {
    const { page = 1, pageSize = 20, startDate, endDate, type, source } = query;
    const filter: Record<string, any> = { userId };

    if (type) {
      filter.type = type;
    }

    if (source) {
      filter.source = source;
    }

    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate) filter.entryDate.$lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.calorieModel
        .find(filter)
        .sort({ entryDate: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.calorieModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  /**
   * @description 查询单条卡路里条目
   * @param userId 当前用户 ID
   * @param id 条目 ID
   * @returns 条目详情
   * @throws NotFoundException 条目不存在或不属于当前用户
   */
  async findOne(userId: string, id: string) {
    const entry = await this.calorieModel.findOne({ _id: id, userId }).exec();
    if (!entry) {
      throw new NotFoundException('条目不存在');
    }
    return entry;
  }

  /**
   * @description 更新卡路里条目
   * @param userId 当前用户 ID
   * @param id 条目 ID
   * @param dto 更新参数
   * @returns 更新后的条目
   * @throws NotFoundException 条目不存在或不属于当前用户
   */
  async update(userId: string, id: string, dto: UpdateCalorieEntryDto) {
    const entry = await this.calorieModel
      .findOneAndUpdate({ _id: id, userId }, dto, { new: true })
      .exec();
    if (!entry) {
      throw new NotFoundException('条目不存在');
    }
    return entry;
  }

  /**
   * @description 删除卡路里条目
   * @param userId 当前用户 ID
   * @param id 条目 ID
   * @returns 删除的条目
   * @throws NotFoundException 条目不存在或不属于当前用户
   */
  async remove(userId: string, id: string) {
    const entry = await this.calorieModel
      .findOneAndDelete({ _id: id, userId })
      .exec();
    if (!entry) {
      throw new NotFoundException('条目不存在');
    }
    return entry;
  }

  /**
   * @description 查询指定时间范围内每日卡路里摄入和消耗汇总
   * @param userId 当前用户 ID
   * @param dto 查询参数（startDate, endDate）
   * @returns 以日期为 key 的对象，value 包含 totalIntake 和 totalBurn
   */
  async getDailySummary(
    userId: string,
    dto: QueryDailySummaryDto,
  ): Promise<Record<string, { totalIntake: number; totalBurn: number }>> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    end.setUTCHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          userId: userId,
          entryDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$entryDate' } },
            type: '$type',
          },
          total: { $sum: '$calories' },
        },
      },
    ];

    const results = await this.calorieModel.aggregate(pipeline).exec();

    const summary: Record<string, { totalIntake: number; totalBurn: number }> =
      {};
    for (const row of results) {
      const date = row._id.date;
      if (!summary[date]) {
        summary[date] = { totalIntake: 0, totalBurn: 0 };
      }
      if (row._id.type === CalorieType.INTAKE) {
        summary[date].totalIntake = row.total;
      } else {
        summary[date].totalBurn = row.total;
      }
    }

    return summary;
  }

  /**
   * @description 统计近 7 天卡路里摄入与消耗数据（含详细条目列表）
   * @param userId 当前用户 ID
   * @returns 摄入/消耗总量、条数、详细条目列表（按日期降序）
   */
  async summarizeLast7Days(userId: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const entries = await this.calorieModel
      .find({ userId, entryDate: { $gte: startDate } })
      .sort({ entryDate: -1 })
      .select('type title calories description entryDate')
      .lean()
      .exec();

    const intakeEntries: {
      title: string;
      calories: number;
      description: string;
      entryDate: Date;
    }[] = [];
    const burnEntries: {
      title: string;
      calories: number;
      description: string;
      entryDate: Date;
    }[] = [];
    let intakeTotal = 0;
    let burnTotal = 0;

    for (const entry of entries) {
      const item = {
        title: entry.title,
        calories: entry.calories,
        description: entry.description ?? '',
        entryDate: entry.entryDate,
      };
      if (entry.type === CalorieType.INTAKE) {
        intakeEntries.push(item);
        intakeTotal += entry.calories;
      } else {
        burnEntries.push(item);
        burnTotal += entry.calories;
      }
    }

    return {
      intakeTotal,
      intakeCount: intakeEntries.length,
      burnTotal,
      burnCount: burnEntries.length,
      intakeEntries,
      burnEntries,
    };
  }
}
