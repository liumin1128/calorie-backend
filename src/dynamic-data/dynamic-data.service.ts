import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DynamicData,
  DynamicDataDocument,
} from './schemas/dynamic-data.schema';
import { CreateDynamicDataDto } from './dto/create-dynamic-data.dto';

@Injectable()
export class DynamicDataService {
  constructor(
    @InjectModel(DynamicData.name)
    private dynamicDataModel: Model<DynamicDataDocument>,
  ) {}

  /**
   * 录入动态数据
   * @param userId - 用户 ID
   * @param dto - 录入数据（category, value, recordedAt?）
   * @returns 创建的动态数据记录
   */
  async create(userId: string, dto: CreateDynamicDataDto) {
    return this.dynamicDataModel.create({
      userId: new Types.ObjectId(userId),
      category: dto.category,
      value: dto.value,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
    });
  }

  /**
   * 时间点查询——取截止到指定日期的最新一条数据
   * @param userId - 用户 ID
   * @param category - 数据类别（如 height, weight）
   * @param date - 截止日期，默认当天
   * @returns 截止到该日期的最新一条记录，无数据返回 null
   */
  async findLatest(userId: string, category: string, date?: Date) {
    const targetDate = date ?? new Date();
    const { dayEnd } = this.getDayRange(targetDate);

    return this.dynamicDataModel
      .findOne({
        userId: new Types.ObjectId(userId),
        category,
        recordedAt: { $lte: dayEnd },
      })
      .sort({ recordedAt: -1 });
  }

  /**
   * 时间段趋势查询——每天取最新一条数据，按日期升序返回
   * @param userId - 用户 ID
   * @param category - 数据类别
   * @param startDate - 起始日期
   * @param endDate - 结束日期
   * @returns 趋势列表 [{ date, value, recordedAt }]
   */
  async findTrend(
    userId: string,
    category: string,
    startDate: Date,
    endDate: Date,
  ) {
    const { dayStart } = this.getDayRange(startDate);
    const { dayEnd } = this.getDayRange(endDate);

    const results = await this.dynamicDataModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          category,
          recordedAt: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $sort: { recordedAt: 1 } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' },
          },
          value: { $last: '$value' },
          recordedAt: { $last: '$recordedAt' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          value: 1,
          recordedAt: 1,
        },
      },
    ]);

    return results;
  }

  /**
   * 批量查询多个类别的最新值
   * @param userId - 用户 ID
   * @param categories - 类别数组（如 ['height', 'weight']）
   * @param beforeDate - 截止日期（可选），传入时限制 recordedAt <= beforeDate
   * @returns Map<category, { value, recordedAt }>
   */
  async findLatestByCategories(
    userId: string,
    categories: string[],
    beforeDate?: Date,
  ): Promise<Map<string, { value: number; recordedAt: Date }>> {
    const matchCondition: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      category: { $in: categories },
    };
    if (beforeDate) {
      matchCondition.recordedAt = { $lte: beforeDate };
    }

    const results = await this.dynamicDataModel.aggregate([
      {
        $match: matchCondition,
      },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$category',
          value: { $first: '$value' },
          recordedAt: { $first: '$recordedAt' },
        },
      },
    ]);

    const map = new Map<string, { value: number; recordedAt: Date }>();
    for (const item of results) {
      map.set(item._id, { value: item.value, recordedAt: item.recordedAt });
    }
    return map;
  }

  /** 获取某天的时间范围 00:00:00 ~ 23:59:59.999 */
  private getDayRange(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return { dayStart, dayEnd };
  }
}
