import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { FoodService } from './food.service';

describe('FoodService', () => {
  let service: FoodService;
  let mockHttpService: { get: jest.Mock };

  beforeEach(() => {
    mockHttpService = { get: jest.fn() };
    service = new FoodService(mockHttpService as any);
  });

  describe('lookupByBarcode - 成功查询', () => {
    it('应返回结构化的食品营养数据', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            status: 1,
            product: {
              product_name: 'Nutella',
              image_front_url: 'https://images.openfoodfacts.org/nutella.jpg',
              brands: 'Nutella',
              quantity: '400 g',
              nutrition_data_per: '100g',
              product_quantity: 400,
              product_quantity_unit: 'g',
              nutriments: {
                'energy-kcal_100g': 539,
                'energy-kj_100g': 2255,
                proteins_100g: 6.3,
                carbohydrates_100g: 57.5,
                fat_100g: 30.9,
                'saturated-fat_100g': 10.6,
                sugars_100g: 56.3,
                fiber_100g: 3.4,
                salt_100g: 0.107,
                sodium_100g: 0.0428,
                calcium_100g: 80,
                iron_100g: 2.5,
              },
            },
          },
        }),
      );

      const result = await service.lookupByBarcode('3017620422003');

      expect(result.name).toBe('Nutella');
      expect(result.imageUrl).toBe(
        'https://images.openfoodfacts.org/nutella.jpg',
      );
      expect(result.brand).toBe('Nutella');
      expect(result.quantity).toBe('400 g');
      expect(result.nutritionDataPer).toBe('100g');
      expect(result.productQuantity).toBe(400);
      expect(result.productQuantityUnit).toBe('g');
      expect(result.calories).toBe(539);
      expect(result.energyKj).toBe(2255);
      expect(result.nutrition.protein).toBe(6.3);
      expect(result.nutrition.carbohydrates).toBe(57.5);
      expect(result.nutrition.fat).toBe(30.9);
      expect(result.nutrition.saturatedFat).toBe(10.6);
      expect(result.nutrition.sugars).toBe(56.3);
      expect(result.nutrition.fiber).toBe(3.4);
      expect(result.nutrition.salt).toBe(0.107);
      // sodium 从 g 转换为 mg
      expect(result.minerals).toEqual(
        expect.objectContaining({
          sodium: 43,
          calcium: 80,
          iron: 2.5,
        }),
      );
    });

    it('缺失营养字段应返回 null', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            status: 1,
            product: {
              product_name: '某食品',
              nutriments: {},
            },
          },
        }),
      );

      const result = await service.lookupByBarcode('1234567890');

      expect(result.name).toBe('某食品');
      expect(result.calories).toBeNull();
      expect(result.energyKj).toBeNull();
      expect(result.nutrition.protein).toBeNull();
      expect(result.nutrition.saturatedFat).toBeNull();
      expect(result.nutrition.sugars).toBeNull();
      expect(result.nutrition.salt).toBeNull();
      expect(result.minerals).toEqual({});
    });

    it('元气森林气泡水（per 100ml）应返回基准单位含量和估算水分', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            status: 1,
            product: {
              product_name: '元气森林气泡水橙子味',
              brands: '元气森林',
              quantity: '480ml',
              nutrition_data_per: '100ml',
              product_quantity: 480,
              product_quantity_unit: 'ml',
              nutriments: {
                'energy-kcal_100g': 0,
                'energy-kj_100g': 0,
                carbohydrates_100g: 2.5,
                fat_100g: 0,
                'saturated-fat_100g': 0,
                sugars_100g: 0,
                salt_100g: 0.0725,
                sodium_100g: 0.029,
              },
            },
          },
        }),
      );

      const result = await service.lookupByBarcode('6937003704014');

      expect(result.nutritionDataPer).toBe('100ml');
      expect(result.productQuantity).toBe(480);
      expect(result.productQuantityUnit).toBe('ml');
      expect(result.calories).toBe(0);
      expect(result.nutrition.carbohydrates).toBe(2.5);
      expect(result.nutrition.salt).toBe(0.0725);
      // 饮料水分估算：100 - (0+0+2.5+0+0.0725) = 97.43 per 100ml
      expect(result.water).toBe(97.43);
    });
  });

  describe('lookupByBarcode - 产品不存在', () => {
    it('status !== 1 时应抛出 404', async () => {
      mockHttpService.get.mockReturnValue(
        of({ data: { status: 0, product: null } }),
      );

      await expect(service.lookupByBarcode('0000000000')).rejects.toThrow(
        new HttpException('未找到该条码对应的食品信息', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('lookupByBarcode - API 异常', () => {
    it('HTTP 请求失败时应抛出 502', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network Error')),
      );

      await expect(service.lookupByBarcode('3017620422003')).rejects.toThrow(
        new HttpException(
          '食品数据库查询失败，请稍后重试',
          HttpStatus.BAD_GATEWAY,
        ),
      );
    });
  });
});
