import { IsNotEmpty, IsNumber, IsString, Matches, Min } from 'class-validator';

export class SetWaterDto {
  /** 日期 YYYY-MM-DD */
  @IsString()
  @IsNotEmpty({ message: 'date 为必填项' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date 必须为 YYYY-MM-DD 格式',
  })
  date: string;

  /** 饮水量 (ml) */
  @IsNumber({}, { message: 'amount 必须为数字' })
  @Min(0, { message: '饮水量不能为负数' })
  amount: number;
}
