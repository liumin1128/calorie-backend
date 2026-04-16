import { IsDateString, IsNotEmpty, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStartBeforeEnd', async: false })
class IsStartBeforeEndConstraint implements ValidatorConstraintInterface {
  validate(_value: string, args: ValidationArguments) {
    const obj = args.object as QueryWaterDto;
    if (!obj.startDate || !obj.endDate) return true;
    return obj.startDate <= obj.endDate;
  }

  defaultMessage() {
    return 'startDate 不能晚于 endDate';
  }
}

export class QueryWaterDto {
  @IsNotEmpty({ message: 'startDate 为必填项' })
  @IsDateString({}, { message: 'startDate 必须为有效的日期格式（YYYY-MM-DD）' })
  startDate: string;

  @IsNotEmpty({ message: 'endDate 为必填项' })
  @IsDateString({}, { message: 'endDate 必须为有效的日期格式（YYYY-MM-DD）' })
  @Validate(IsStartBeforeEndConstraint)
  endDate: string;
}
