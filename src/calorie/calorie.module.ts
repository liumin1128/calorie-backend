import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { CalorieService } from './calorie.service';
import { CalorieController } from './calorie.controller';
import {
  CalorieEntry,
  CalorieEntrySchema,
} from './schemas/calorie-entry.schema';

@Module({
  imports: [
    AiModule,
    MongooseModule.forFeature([
      { name: CalorieEntry.name, schema: CalorieEntrySchema },
    ]),
  ],
  controllers: [CalorieController],
  providers: [CalorieService],
  exports: [CalorieService],
})
export class CalorieModule {}
