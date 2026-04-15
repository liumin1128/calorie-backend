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
  /** 蛋白质 (g) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  protein?: number;

  /** 脂肪 (g) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  fat?: number;

  /** 碳水化合物 (g) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  carbohydrates?: number;

  /** 膳食纤维 (g) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  fiber?: number;
}

export class MineralsDto {
  /** 钙 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  calcium?: number;

  /** 镁 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  magnesium?: number;

  /** 钾 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  potassium?: number;

  /** 钠 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  sodium?: number;

  /** 磷 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  phosphorus?: number;

  /** 铁 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  iron?: number;

  /** 锌 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  zinc?: number;

  /** 锰 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  manganese?: number;

  /** 铜 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  copper?: number;

  /** 硒 (μg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  selenium?: number;

  /** 碘 (μg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  iodine?: number;

  /** 铬 (μg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  chromium?: number;

  /** 氟 (mg) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  fluoride?: number;
}

export class CreateCalorieEntryDto {
  @IsEnum(CalorieType)
  type: CalorieType;

  /** 能量 (kcal) */
  @IsNumber()
  @Min(0.01, { message: '卡路里数值必须大于 0' })
  calories: number;

  /** 水分 (g) */
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

  /** 运动时长 (min)，仅 type=burn 时有效 */
  @IsNumber()
  @Min(0)
  @IsOptional()
  duration?: number;

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
