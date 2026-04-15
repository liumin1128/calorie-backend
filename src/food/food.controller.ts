import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FoodService } from './food.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BarcodeParamDto } from './dto/barcode-param.dto';
import { BarcodeFoodResponseDto } from './dto/barcode-food-response.dto';

@ApiTags('食品')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('food')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  /**
   * @description 通过条形码查询食品营养信息
   * @param params 包含条形码的路由参数
   * @returns 食品名称、封面图、营养成分和微量元素
   * @throws 400 条形码格式无效
   * @throws 404 未找到该条码对应的食品信息
   * @throws 502 食品数据库查询失败
   */
  @Get('barcode/:code')
  async getByBarcode(
    @Param() params: BarcodeParamDto,
  ): Promise<BarcodeFoodResponseDto> {
    return this.foodService.lookupByBarcode(params.code);
  }
}
