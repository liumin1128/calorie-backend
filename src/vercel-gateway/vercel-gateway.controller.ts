import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuggestDto } from './dto/suggest.dto';
import { VercelGatewayService } from './vercel-gateway.service';

@Controller('gateway')
export class VercelGatewayController {
  constructor(private readonly vercelGatewayService: VercelGatewayService) {}

  /**
   * 验证 Vercel AI Gateway Token 已配置就绪（不消耗 AI 额度）
   */
  @UseGuards(JwtAuthGuard)
  @Get('ping')
  ping() {
    return this.vercelGatewayService.ping();
  }

  /**
   * 获取 AI 个性化健康建议：后端自动提取用户健康上下文和近7天饮食/运动记录
   * @param req JWT 请求对象（提取 userId）
   * @param dto 用户问题（最大 500 字符）
   * @returns { suggestion: string, model: string }
   */
  @UseGuards(JwtAuthGuard)
  @Post('ai/suggest')
  getSuggestion(@Request() req, @Body() dto: SuggestDto) {
    return this.vercelGatewayService.getSuggestion(req.user.sub, dto.question);
  }
}
