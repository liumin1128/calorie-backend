import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FoodController } from './food.controller';
import { FoodService } from './food.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      headers: {
        'User-Agent': 'CalorieApp/1.0 (contact@example.com)',
      },
    }),
  ],
  controllers: [FoodController],
  providers: [FoodService],
})
export class FoodModule {}
