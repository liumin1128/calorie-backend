import {
  IsEnum,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
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
}
