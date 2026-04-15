import {
  Controller,
  Put,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 更新用户基础信息
   * @description 部分更新已认证用户的个人资料，仅修改请求中包含的字段
   * @param req - 请求对象（含 JWT 解析后的 user 信息）
   * @param req.user.sub - 用户 ID（从 JWT payload 提取）
   * @param dto - 更新请求体
   * @param dto.nickname - 昵称（可选）
   * @param dto.gender - 性别：male | female | other（可选）
   * @param dto.birthday - 生日，ISO 日期字符串（可选）
   * @param dto.signature - 个性签名，最大 200 字符（可选）
   * @returns 更新后的用户基础信息（不含密码）
   */
  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.sub, dto);
  }

  /**
   * 获取完整用户信息
   * @description 返回已认证用户的完整信息，包含基础资料和截止到指定日期的最新身高体重
   * @param req - 请求对象（含 JWT 解析后的 user 信息）
   * @param req.user.sub - 用户 ID（从 JWT payload 提取）
   * @param date - 截止日期（可选，ISO 日期字符串），不传则返回全局最新数据
   * @returns { id, email, nickname, gender, birthday, signature, latestHeight, latestWeight }
   */
  @UseGuards(JwtAuthGuard)
  @Get('full-profile')
  getFullProfile(
    @Req() req: AuthenticatedRequest,
    @Query('date') date?: string,
  ) {
    const parsedDate = date ? new Date(date) : undefined;
    return this.userService.getFullProfile(req.user.sub, parsedDate);
  }
}
