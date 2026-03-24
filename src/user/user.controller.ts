import { Controller, Put, Get, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.sub, dto);
  }

  /**
   * 获取完整用户信息
   * @description 返回已认证用户的完整信息，包含基础资料和最新身高体重
   * @param req - 请求对象（含 JWT 解析后的 user 信息）
   * @param req.user.sub - 用户 ID（从 JWT payload 提取）
   * @returns { id, email, nickname, gender, birthday, signature, latestHeight, latestWeight }
   */
  @UseGuards(JwtAuthGuard)
  @Get('full-profile')
  getFullProfile(@Request() req) {
    return this.userService.getFullProfile(req.user.sub);
  }
}
