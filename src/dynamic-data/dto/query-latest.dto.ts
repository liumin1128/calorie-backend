import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class QueryLatestDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
