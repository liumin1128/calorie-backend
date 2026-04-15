import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BarcodeFoodResponseDto,
  MineralsDto,
} from './dto/barcode-food-response.dto';

/** Open Food Facts nutriments 中需要提取的矿物质字段映射 */
const MINERAL_KEYS: {
  key: string;
  field: keyof MineralsDto;
  isSodium?: boolean;
}[] = [
  { key: 'sodium_100g', field: 'sodium', isSodium: true },
  { key: 'calcium_100g', field: 'calcium' },
  { key: 'iron_100g', field: 'iron' },
  { key: 'potassium_100g', field: 'potassium' },
  { key: 'magnesium_100g', field: 'magnesium' },
  { key: 'zinc_100g', field: 'zinc' },
  { key: 'phosphorus_100g', field: 'phosphorus' },
  { key: 'manganese_100g', field: 'manganese' },
  { key: 'copper_100g', field: 'copper' },
  { key: 'selenium_100g', field: 'selenium' },
  { key: 'iodine_100g', field: 'iodine' },
  { key: 'chromium_100g', field: 'chromium' },
  { key: 'fluoride_100g', field: 'fluoride' },
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
    'nutrition_data_per',
    'product_quantity',
    'product_quantity_unit',
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

    const nutritionDataPer = (product.nutrition_data_per as string) || null;
    const productQuantity = (product.product_quantity as number) || null;
    const productQuantityUnit =
      (product.product_quantity_unit as string) || null;

    const calories = nutriments['energy-kcal_100g'] ?? null;
    const energyKj = nutriments['energy-kj_100g'] ?? null;
    const isBeverage = nutritionDataPer?.includes('ml') ?? false;
    let water = nutriments['water_100g'] ?? null;

    // 饮料缺少水分数据时，按 100ml 减去固体成分估算
    if (water == null && isBeverage) {
      const solids =
        (nutriments['proteins_100g'] ?? 0) +
        (nutriments['fat_100g'] ?? 0) +
        (nutriments['carbohydrates_100g'] ?? 0) +
        (nutriments['fiber_100g'] ?? 0) +
        (nutriments['salt_100g'] ?? 0);
      water = Math.round((100 - solids) * 100) / 100;
    }

    const nutrition = {
      protein: nutriments['proteins_100g'] ?? null,
      fat: nutriments['fat_100g'] ?? null,
      saturatedFat: nutriments['saturated-fat_100g'] ?? null,
      carbohydrates: nutriments['carbohydrates_100g'] ?? null,
      sugars: nutriments['sugars_100g'] ?? null,
      fiber: nutriments['fiber_100g'] ?? null,
      salt: nutriments['salt_100g'] ?? null,
    };

    const minerals = this.extractMinerals(nutriments);

    return {
      name: (product.product_name as string) || null,
      imageUrl: (product.image_front_url as string) || null,
      brand: (product.brands as string) || null,
      quantity: (product.quantity as string) || null,
      nutritionDataPer,
      productQuantity,
      productQuantityUnit,
      calories,
      energyKj,
      water,
      nutrition,
      minerals,
    };
  }

  /** 从 nutriments 中提取可用的矿物质 */
  private extractMinerals(nutriments: Record<string, number>): MineralsDto {
    const minerals: MineralsDto = {};
    for (const { key, field, isSodium } of MINERAL_KEYS) {
      const value = nutriments[key];
      if (value != null && value > 0) {
        // sodium 在 OFF 中单位是 g，转换为 mg
        minerals[field] = isSodium ? Math.round(value * 1000) : value;
      }
    }
    return minerals;
  }
}
