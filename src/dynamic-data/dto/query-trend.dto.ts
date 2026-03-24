import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class QueryTrendDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  /** 校验 startDate ≤ endDate，在 Service 层调用 */
  validateDateRange() {
    if (new Date(this.startDate) > new Date(this.endDate)) {
      throw new BadRequestException('startDate 不能晚于 endDate');
    }
  }
}
