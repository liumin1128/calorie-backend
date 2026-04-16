import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WaterService } from './water.service';
import { SetWaterDto } from './dto/set-water.dto';
import { QueryWaterDto } from './dto/query-water.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('饮水记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('water')
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  /**
   * @description 设置某天饮水量（覆盖更新）
   * @param req JWT 请求对象
   * @param dto { date: "YYYY-MM-DD", amount: number }
   * @returns { date, amount }
   */
  @Put()
  setWater(@Req() req: AuthenticatedRequest, @Body() dto: SetWaterDto) {
    return this.waterService.setWater(req.user.sub, dto);
  }

  /**
   * @description 查询日期范围内每日饮水量
   * @param req JWT 请求对象
   * @param query { startDate, endDate }
   * @returns { data: [{ date, amount }] }
   */
  @Get()
  getWater(@Req() req: AuthenticatedRequest, @Query() query: QueryWaterDto) {
    return this.waterService.getWater(req.user.sub, query);
  }
}
