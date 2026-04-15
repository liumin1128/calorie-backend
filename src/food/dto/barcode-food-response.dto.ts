export class MineralDto {
  name: string;
  value: number;
  unit: string;
}

export class BarcodeFoodResponseDto {
  name: string | null;
  imageUrl: string | null;
  brand: string | null;
  quantity: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  water: number | null;
  minerals: MineralDto[];
}
