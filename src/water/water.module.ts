import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaterIntake, WaterIntakeSchema } from './schemas/water-intake.schema';
import { WaterService } from './water.service';
import { WaterController } from './water.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WaterIntake.name, schema: WaterIntakeSchema },
    ]),
  ],
  controllers: [WaterController],
  providers: [WaterService],
})
export class WaterModule {}
