import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { DynamicDataService } from '../dynamic-data/dynamic-data.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private dynamicDataService: DynamicDataService,
  ) {}

  /**
   * 部分更新用户基础信息
   * @param userId - 用户 ID
   * @param dto - 需要更新的字段（均为可选）
   * @returns 更新后的用户信息（不含密码）
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: dto }, { new: true })
      .select('-password');
    return user;
  }

  /**
   * 获取完整用户信息（基础资料 + 最新身高体重）
   * @param userId - 用户 ID
   * @param date - 截止日期（可选），传入时返回截止到该日期的最新动态数据
   * @returns 用户基础信息及最新动态数据
   */
  async getFullProfile(userId: string, date?: Date) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      return null;
    }

    let beforeDate: Date | undefined;
    if (date) {
      beforeDate = new Date(date);
      beforeDate.setHours(23, 59, 59, 999);
    }

    const latestDynamicData =
      await this.dynamicDataService.findLatestByCategories(
        userId,
        ['height', 'weight'],
        beforeDate,
      );

    return {
      id: user._id,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender ?? null,
      birthday: user.birthday ?? null,
      signature: user.signature ?? null,
      targetWeight: user.targetWeight ?? null,
      healthConditions: user.healthConditions?.length
        ? user.healthConditions
        : null,
      latestHeight: latestDynamicData.get('height') ?? null,
      latestWeight: latestDynamicData.get('weight') ?? null,
    };
  }
}
