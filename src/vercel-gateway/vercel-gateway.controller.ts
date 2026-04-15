import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SuggestDto } from './dto/suggest.dto';
import { VercelGatewayService } from './vercel-gateway.service';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@ApiTags('AI 网关')
@ApiBearerAuth()
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
  getSuggestion(@Req() req: AuthenticatedRequest, @Body() dto: SuggestDto) {
    return this.vercelGatewayService.getSuggestion(req.user.sub, dto.question);
  }

  /**
   * 分析用户上传的食物图片，返回结构化营养成分和卡路里数据
   * @param file 用户上传的图片（multipart/form-data, field: image）
   * @returns { foods: FoodNutritionItem[], summary: string, model: string }
   * @throws 400 未上传文件或格式/大小不合法
   * @throws 502 AI 返回内容解析失败
   */
  @UseGuards(JwtAuthGuard)
  @Post('ai/image-nutrition')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary', description: '食物图片' },
      },
      required: ['image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              '不支持的文件格式，仅允许 JPEG、PNG、WebP、GIF',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  analyzeImageNutrition(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传食物图片');
    }
    return this.vercelGatewayService.analyzeImageNutrition(file);
  }
}
