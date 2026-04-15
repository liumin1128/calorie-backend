import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsDateString,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CalorieType,
  EntrySource,
  MealType,
} from '../schemas/calorie-entry.schema';

export class NutritionDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  protein?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fat?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  carbohydrates?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fiber?: number;
}

export class MineralsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  calcium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  magnesium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  potassium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sodium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  phosphorus?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iron?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  zinc?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  manganese?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  copper?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  selenium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  iodine?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  chromium?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fluoride?: number;
}

export class CreateCalorieEntryDto {
  @IsEnum(CalorieType)
  type: CalorieType;

  @IsNumber()
  @Min(0.01, { message: '卡路里数值必须大于 0' })
  calories: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  water?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsUrl({}, { each: true, message: '图片地址必须为合法 URL' })
  @IsOptional()
  images?: string[];

  @IsDateString()
  entryDate: string;

  @IsEnum(EntrySource)
  @IsOptional()
  source?: EntrySource;

  @IsEnum(MealType)
  @IsOptional()
  mealType?: MealType;

  @IsString()
  @IsOptional()
  externalId?: string;

  @ValidateNested()
  @Type(() => NutritionDto)
  @IsOptional()
  nutrition?: NutritionDto;

  @ValidateNested()
  @Type(() => MineralsDto)
  @IsOptional()
  minerals?: MineralsDto;
}
