import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CalorieService } from './calorie.service';
import { CreateCalorieEntryDto } from './dto/create-calorie-entry.dto';
import { UpdateCalorieEntryDto } from './dto/update-calorie-entry.dto';
import { QueryCalorieEntryDto } from './dto/query-calorie-entry.dto';
import { QueryDailySummaryDto } from './dto/query-daily-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('calorie')
export class CalorieController {
  constructor(private readonly calorieService: CalorieService) {}

  /**
   * @description 创建或更新卡路里条目（有 externalId 时基于 userId + externalId 去重）
   * @param req JWT 请求对象
   * @param dto 创建参数
   * @param res Express Response
   * @returns 条目数据，新建返回 201，更新返回 200
   */
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCalorieEntryDto,
    @Res() res: Response,
  ) {
    const { data, isNew } = await this.calorieService.create(req.user.sub, dto);
    return res.status(isNew ? 201 : 200).json(data);
  }

  /**
   * @description 分页查询卡路里条目列表
   * @param req JWT 请求对象
   * @param query 分页与筛选参数
   * @returns { data, total }
   */
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryCalorieEntryDto,
  ) {
    return this.calorieService.findAll(req.user.sub, query);
  }

  /**
   * @description 查询指定时间范围内每日卡路里摄入和消耗汇总
   * @param req JWT 请求对象
   * @param query 查询参数（startDate, endDate）
   * @returns 以日期为 key 的对象，value 包含 totalIntake 和 totalBurn
   */
  @Get('daily-summary')
  getDailySummary(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryDailySummaryDto,
  ) {
    return this.calorieService.getDailySummary(req.user.sub, query);
  }

  /**
   * @description 查询单条卡路里条目
   * @param req JWT 请求对象
   * @param id 条目 ID
   * @returns 条目详情
   * @throws NotFoundException 条目不存在
   */
  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.calorieService.findOne(req.user.sub, id);
  }

  /**
   * @description 更新卡路里条目
   * @param req JWT 请求对象
   * @param id 条目 ID
   * @param dto 更新参数
   * @returns 更新后的条目
   * @throws NotFoundException 条目不存在
   */
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCalorieEntryDto,
  ) {
    return this.calorieService.update(req.user.sub, id, dto);
  }

  /**
   * @description 删除卡路里条目
   * @param req JWT 请求对象
   * @param id 条目 ID
   * @returns 删除的条目
   * @throws NotFoundException 条目不存在
   */
  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.calorieService.remove(req.user.sub, id);
  }
}
