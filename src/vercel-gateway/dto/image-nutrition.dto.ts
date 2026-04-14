export interface FoodNutritionItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  unit: string;
  quantity: number;
}

export interface ImageNutritionResponseDto {
  foods: FoodNutritionItem[];
  summary: string;
  model: string;
}
