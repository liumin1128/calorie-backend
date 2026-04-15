import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BarcodeFoodResponseDto,
  MineralDto,
} from './dto/barcode-food-response.dto';

/** Open Food Facts nutriments 中需要提取的微量元素映射 */
const MINERAL_KEYS: { key: string; name: string; unit: string }[] = [
  { key: 'sodium_100g', name: '钠', unit: 'mg' },
  { key: 'calcium_100g', name: '钙', unit: 'mg' },
  { key: 'iron_100g', name: '铁', unit: 'mg' },
  { key: 'potassium_100g', name: '钾', unit: 'mg' },
  { key: 'magnesium_100g', name: '镁', unit: 'mg' },
  { key: 'zinc_100g', name: '锌', unit: 'mg' },
  { key: 'phosphorus_100g', name: '磷', unit: 'mg' },
];

@Injectable()
export class FoodService {
  private static readonly API_BASE =
    'https://world.openfoodfacts.org/api/v2/product';

  /** 请求时只拉取需要的字段，减少响应体积 */
  private static readonly FIELDS = [
    'product_name',
    'image_front_url',
    'brands',
    'quantity',
    'nutriments',
  ].join(',');

  constructor(private readonly httpService: HttpService) {}

  /**
   * 通过条形码查询 Open Food Facts，返回结构化营养数据
   * @param code 条形码（4-14 位纯数字）
   * @returns 食品营养信息
   * @throws HttpException 404 产品不存在 / 502 外部 API 异常
   */
  async lookupByBarcode(code: string): Promise<BarcodeFoodResponseDto> {
    let data: Record<string, unknown>;
    try {
      const url = `${FoodService.API_BASE}/${code}.json?fields=${FoodService.FIELDS}`;
      const response = await firstValueFrom(
        this.httpService.get<{
          status: number;
          product?: Record<string, unknown>;
        }>(url),
      );
      data = response.data as Record<string, unknown>;
    } catch {
      throw new HttpException(
        '食品数据库查询失败，请稍后重试',
        HttpStatus.BAD_GATEWAY,
      );
    }

    if (
      (data as { status?: number }).status !== 1 ||
      !(data as { product?: unknown }).product
    ) {
      throw new HttpException(
        '未找到该条码对应的食品信息',
        HttpStatus.NOT_FOUND,
      );
    }

    const product = (data as { product: Record<string, unknown> }).product;
    const nutriments = (product.nutriments ?? {}) as Record<string, number>;

    return {
      name: (product.product_name as string) || null,
      imageUrl: (product.image_front_url as string) || null,
      brand: (product.brands as string) || null,
      quantity: (product.quantity as string) || null,
      calories: nutriments['energy-kcal_100g'] ?? null,
      protein: nutriments['proteins_100g'] ?? null,
      carbs: nutriments['carbohydrates_100g'] ?? null,
      fat: nutriments['fat_100g'] ?? null,
      fiber: nutriments['fiber_100g'] ?? null,
      minerals: this.extractMinerals(nutriments),
    };
  }

  /** 从 nutriments 中提取可用的微量元素 */
  private extractMinerals(nutriments: Record<string, number>): MineralDto[] {
    const minerals: MineralDto[] = [];
    for (const { key, name, unit } of MINERAL_KEYS) {
      const value = nutriments[key];
      if (value != null && value > 0) {
        // sodium 在 OFF 中单位是 g，转换为 mg
        const converted =
          key === 'sodium_100g' ? Math.round(value * 1000) : value;
        minerals.push({ name, value: converted, unit });
      }
    }
    return minerals;
  }
}
