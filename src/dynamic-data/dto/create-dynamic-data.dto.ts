import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateDynamicDataDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsDateString()
  @IsOptional()
  recordedAt?: string;
}
