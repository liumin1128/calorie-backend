import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DynamicDataService } from './dynamic-data.service';
import { CreateDynamicDataDto } from './dto/create-dynamic-data.dto';
import { QueryLatestDto } from './dto/query-latest.dto';
import { QueryTrendDto } from './dto/query-trend.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dynamic-data')
export class DynamicDataController {
  constructor(private dynamicDataService: DynamicDataService) {}

  /**
   * 录入动态数据
   * @description 创建一条动态健康数据记录（如身高、体重），采用追加模式
   * @param req - 请求对象（含 JWT 解析后的 user 信息）
   * @param req.user.sub - 用户 ID
   * @param dto - 录入请求体
   * @param dto.category - 数据类别（必填，如 "height"、"weight"）
   * @param dto.value - 数据值（必填，数字类型）
   * @param dto.recordedAt - 记录时间（可选，ISO 日期字符串，默认当前时间）
   * @returns 创建的动态数据记录
   */
  @Post()
  create(@Request() req, @Body() dto: CreateDynamicDataDto) {
    return this.dynamicDataService.create(req.user.sub, dto);
  }

  /**
   * 时间点查询动态数据
   * @description 查询指定类别在指定日期的最新一条数据
   * @param req - 请求对象
   * @param req.user.sub - 用户 ID
   * @param query - 查询参数
   * @param query.category - 数据类别（必填）
   * @param query.date - 查询日期（可选，ISO 日期字符串，默认当天）
   * @returns 当天最新一条记录，无数据返回 null
   */
  @Get('latest')
  findLatest(@Request() req, @Query() query: QueryLatestDto) {
    const date = query.date ? new Date(query.date) : undefined;
    return this.dynamicDataService.findLatest(
      req.user.sub,
      query.category,
      date,
    );
  }

  /**
   * 时间段趋势查询动态数据
   * @description 查询指定类别在时间段内每天最新数据的趋势列表
   * @param req - 请求对象
   * @param req.user.sub - 用户 ID
   * @param query - 查询参数
   * @param query.category - 数据类别（必填）
   * @param query.startDate - 起始日期（必填，ISO 日期字符串）
   * @param query.endDate - 结束日期（必填，ISO 日期字符串）
   * @returns 趋势列表 [{ date, value, recordedAt }]，无数据返回 []
   * @throws BadRequestException startDate 晚于 endDate
   */
  @Get('trend')
  findTrend(@Request() req, @Query() query: QueryTrendDto) {
    query.validateDateRange();
    return this.dynamicDataService.findTrend(
      req.user.sub,
      query.category,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }
}
