import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SuggestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}
