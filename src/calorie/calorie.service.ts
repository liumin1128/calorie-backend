import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CalorieEntry,
  CalorieEntryDocument,
} from './schemas/calorie-entry.schema';
import { CreateCalorieEntryDto } from './dto/create-calorie-entry.dto';
import { UpdateCalorieEntryDto } from './dto/update-calorie-entry.dto';
import { QueryCalorieEntryDto } from './dto/query-calorie-entry.dto';

@Injectable()
export class CalorieService {
  constructor(
    @InjectModel(CalorieEntry.name)
    private calorieModel: Model<CalorieEntryDocument>,
  ) {}

  /**
   * @description 创建卡路里条目
   * @param userId 当前用户 ID
   * @param dto 创建参数
   * @returns 新创建的条目
   */
  async create(userId: string, dto: CreateCalorieEntryDto) {
    return this.calorieModel.create({ ...dto, userId });
  }

  /**
   * @description 分页查询卡路里条目列表
   * @param userId 当前用户 ID
   * @param query 分页与筛选参数
   * @returns { data, total }
   */
  async findAll(userId: string, query: QueryCalorieEntryDto) {
    const { page = 1, pageSize = 20, startDate, endDate, type } = query;
    const filter: Record<string, any> = { userId };

    if (type) {
      filter.type = type;
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
}
