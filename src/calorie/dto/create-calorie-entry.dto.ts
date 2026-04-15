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
} from 'class-validator';
import { CalorieType, EntrySource } from '../schemas/calorie-entry.schema';

export class CreateCalorieEntryDto {
  @IsEnum(CalorieType)
  type: CalorieType;

  @IsNumber()
  @Min(0.01, { message: '卡路里数值必须大于 0' })
  calories: number;

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

  @IsString()
  @IsOptional()
  externalId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  protein?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  carbs?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fat?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fiber?: number;
}
