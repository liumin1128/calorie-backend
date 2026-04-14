export interface MineralItem {
  name: string;
  value: number;
  unit: string;
}

export interface FoodNutritionItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  unit: string;
  quantity: number;
  minerals: MineralItem[];
}

export interface ImageNutritionResponseDto {
  foods: FoodNutritionItem[];
  summary: string;
  model: string;
}
