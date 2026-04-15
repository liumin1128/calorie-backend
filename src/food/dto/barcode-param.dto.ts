import { IsString, Matches } from 'class-validator';

export class BarcodeParamDto {
  @IsString()
  @Matches(/^\d{4,14}$/, {
    message: '条形码格式无效，请输入 4-14 位数字',
  })
  code: string;
}
