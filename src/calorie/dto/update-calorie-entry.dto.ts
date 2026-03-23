import { PartialType } from '@nestjs/mapped-types';
import { CreateCalorieEntryDto } from './create-calorie-entry.dto';

export class UpdateCalorieEntryDto extends PartialType(CreateCalorieEntryDto) {}
