import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户注册
   * @description 通过邮箱和密码创建新用户，返回 JWT 令牌和完整用户信息
   * @param dto - 注册请求体
   * @param dto.email - 用户邮箱（唯一）
   * @param dto.password - 密码（最少 6 位）
   * @param dto.nickname - 昵称（可选，默认取邮箱前缀）
   * @returns { access_token, user: { id, email, nickname, gender, birthday, signature, latestHeight, latestWeight } }
   * @throws ConflictException 该邮箱已注册
   */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 用户登录
   * @description 验证邮箱密码，返回 JWT 令牌和完整用户信息（含最新身高体重）
   * @param dto - 登录请求体
   * @param dto.email - 用户邮箱
   * @param dto.password - 密码
   * @returns { access_token, user: { id, email, nickname, gender, birthday, signature, latestHeight, latestWeight } }
   * @throws UnauthorizedException 邮箱或密码错误
   */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * 获取当前用户资料
   * @description 根据 JWT 令牌获取已认证用户的基础信息
   * @param req - 请求对象（含 JWT 解析后的 user 信息）
   * @param req.user.sub - 用户 ID（从 JWT payload 提取）
   * @returns 用户信息（不含密码）
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }
}
