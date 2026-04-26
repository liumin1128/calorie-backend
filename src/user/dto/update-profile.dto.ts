import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';
import { Gender } from '../../auth/schemas/user.schema';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  signature?: string;

  @IsUrl({}, { message: '头像地址必须为合法 URL' })
  @IsOptional()
  avatar?: string;

  @IsNumber()
  @Min(30)
  @Max(300)
  @IsOptional()
  targetWeight?: number;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  healthConditions?: string[];
}
