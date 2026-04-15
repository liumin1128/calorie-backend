export class NutritionDto {
  /** 蛋白质 (g) */
  protein: number | null;
  /** 脂肪 (g) */
  fat: number | null;
  /** 饱和脂肪 (g) */
  saturatedFat: number | null;
  /** 碳水化合物 (g) */
  carbohydrates: number | null;
  /** 糖 (g) */
  sugars: number | null;
  /** 膳食纤维 (g) */
  fiber: number | null;
  /** 盐 (g) */
  salt: number | null;
}

export class MineralsDto {
  /** 钙 (mg) */
  calcium?: number | null;
  /** 镁 (mg) */
  magnesium?: number | null;
  /** 钾 (mg) */
  potassium?: number | null;
  /** 钠 (mg) */
  sodium?: number | null;
  /** 磷 (mg) */
  phosphorus?: number | null;
  /** 铁 (mg) */
  iron?: number | null;
  /** 锌 (mg) */
  zinc?: number | null;
  /** 锰 (mg) */
  manganese?: number | null;
  /** 铜 (mg) */
  copper?: number | null;
  /** 硒 (μg) */
  selenium?: number | null;
  /** 碘 (μg) */
  iodine?: number | null;
  /** 铬 (μg) */
  chromium?: number | null;
  /** 氟 (mg) */
  fluoride?: number | null;
}

export class BarcodeFoodResponseDto {
  name: string | null;
  imageUrl: string | null;
  brand: string | null;
  quantity: string | null;

  /** 营养数据基准，如 "100ml" / "100g" */
  nutritionDataPer: string | null;
  /** 产品总量数值，如 480 */
  productQuantity: number | null;
  /** 产品总量单位，如 "ml" */
  productQuantityUnit: string | null;

  /** 能量 (kcal / 每基准单位) */
  calories: number | null;
  /** 能量 (kJ / 每基准单位) */
  energyKj: number | null;
  /** 水分 (ml per 基准单位)，饮料缺失时自动估算 */
  water: number | null;
  /** 每基准单位营养成分 */
  nutrition: NutritionDto;
  /** 每基准单位矿物质 */
  minerals: MineralsDto;
}
