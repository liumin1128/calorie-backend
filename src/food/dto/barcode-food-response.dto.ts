export class NutritionDto {
  protein: number | null;
  fat: number | null;
  carbohydrates: number | null;
  fiber: number | null;
}

export class MineralsDto {
  calcium?: number | null;
  magnesium?: number | null;
  potassium?: number | null;
  sodium?: number | null;
  phosphorus?: number | null;
  iron?: number | null;
  zinc?: number | null;
  manganese?: number | null;
  copper?: number | null;
  selenium?: number | null;
  iodine?: number | null;
  chromium?: number | null;
  fluoride?: number | null;
}

export class BarcodeFoodResponseDto {
  name: string | null;
  imageUrl: string | null;
  brand: string | null;
  quantity: string | null;
  calories: number | null;
  water: number | null;
  nutrition: NutritionDto;
  minerals: MineralsDto;
}
