export class NutritionDto {
  /** 蛋白质 (g) */
  protein: number | null;
  /** 脂肪 (g) */
  fat: number | null;
  /** 碳水化合物 (g) */
  carbohydrates: number | null;
  /** 膳食纤维 (g) */
  fiber: number | null;
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
  /** 能量 (kcal) */
  calories: number | null;
  /** 水分 (g) */
  water: number | null;
  nutrition: NutritionDto;
  minerals: MineralsDto;
}
