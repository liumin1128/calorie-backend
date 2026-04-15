export interface NutritionInfo {
  /** 蛋白质 (g) */
  protein: number;
  /** 脂肪 (g) */
  fat: number;
  /** 碳水化合物 (g) */
  carbohydrates: number;
  /** 膳食纤维 (g) */
  fiber: number;
}

export interface MineralsInfo {
  /** 钙 (mg) */
  calcium?: number;
  /** 镁 (mg) */
  magnesium?: number;
  /** 钾 (mg) */
  potassium?: number;
  /** 钠 (mg) */
  sodium?: number;
  /** 磷 (mg) */
  phosphorus?: number;
  /** 铁 (mg) */
  iron?: number;
  /** 锌 (mg) */
  zinc?: number;
  /** 锰 (mg) */
  manganese?: number;
  /** 铜 (mg) */
  copper?: number;
  /** 硒 (μg) */
  selenium?: number;
  /** 碘 (μg) */
  iodine?: number;
  /** 铬 (μg) */
  chromium?: number;
  /** 氟 (mg) */
  fluoride?: number;
}

export interface FoodNutritionItem {
  name: string;
  /** 能量 (kcal) */
  calories: number;
  /** 水分 (ml) */
  water: number;
  nutrition: NutritionInfo;
  minerals: MineralsInfo;
  unit: string;
  quantity: number;
}

export interface ImageNutritionResponseDto {
  foods: FoodNutritionItem[];
  summary: string;
  model: string;
}
