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
  Request,
} from '@nestjs/common';
import { CalorieService } from './calorie.service';
import { CreateCalorieEntryDto } from './dto/create-calorie-entry.dto';
import { UpdateCalorieEntryDto } from './dto/update-calorie-entry.dto';
import { QueryCalorieEntryDto } from './dto/query-calorie-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('calorie')
export class CalorieController {
  constructor(private readonly calorieService: CalorieService) {}

  /**
   * @description 创建卡路里条目
   * @param req JWT 请求对象
   * @param dto 创建参数
   * @returns 新创建的条目
   */
  @Post()
  create(@Request() req, @Body() dto: CreateCalorieEntryDto) {
    return this.calorieService.create(req.user.sub, dto);
  }

  /**
   * @description 分页查询卡路里条目列表
   * @param req JWT 请求对象
   * @param query 分页与筛选参数
   * @returns { data, total }
   */
  @Get()
  findAll(@Request() req, @Query() query: QueryCalorieEntryDto) {
    return this.calorieService.findAll(req.user.sub, query);
  }

  /**
   * @description 查询单条卡路里条目
   * @param req JWT 请求对象
   * @param id 条目 ID
   * @returns 条目详情
   * @throws NotFoundException 条目不存在
   */
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
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
    @Request() req,
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
  remove(@Request() req, @Param('id') id: string) {
    return this.calorieService.remove(req.user.sub, id);
  }
}
