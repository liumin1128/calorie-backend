import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WaterIntake,
  WaterIntakeDocument,
} from './schemas/water-intake.schema';
import { SetWaterDto } from './dto/set-water.dto';
import { QueryWaterDto } from './dto/query-water.dto';

@Injectable()
export class WaterService {
  constructor(
    @InjectModel(WaterIntake.name)
    private waterModel: Model<WaterIntakeDocument>,
  ) {}

  /**
   * @description 设置某天饮水量，upsert 模式覆盖更新
   * @param userId 当前用户 ID
   * @param dto { date, amount }
   * @returns { date, amount }
   */
  async setWater(userId: string, dto: SetWaterDto) {
    const record = await this.waterModel.findOneAndUpdate(
      { userId, date: dto.date },
      { $set: { amount: dto.amount } },
      { upsert: true, returnDocument: 'after' },
    );
    return { date: record.date, amount: record.amount };
  }

  /**
   * @description 查询日期范围内每日饮水量
   * @param userId 当前用户 ID
   * @param query { startDate, endDate }
   * @returns { data: [{ date, amount }] }
   */
  async getWater(userId: string, query: QueryWaterDto) {
    const records = await this.waterModel
      .find({
        userId,
        date: { $gte: query.startDate, $lte: query.endDate },
      })
      .sort({ date: 1 })
      .select('date amount -_id')
      .lean();

    return { data: records };
  }
}
