export interface NutritionInfo {
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
}

export interface MineralsInfo {
  calcium?: number;
  magnesium?: number;
  potassium?: number;
  sodium?: number;
  phosphorus?: number;
  iron?: number;
  zinc?: number;
  manganese?: number;
  copper?: number;
  selenium?: number;
  iodine?: number;
  chromium?: number;
  fluoride?: number;
}

export interface FoodNutritionItem {
  name: string;
  calories: number;
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
