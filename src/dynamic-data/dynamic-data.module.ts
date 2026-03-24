import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DynamicData, DynamicDataSchema } from './schemas/dynamic-data.schema';
import { DynamicDataService } from './dynamic-data.service';
import { DynamicDataController } from './dynamic-data.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DynamicData.name, schema: DynamicDataSchema },
    ]),
  ],
  controllers: [DynamicDataController],
  providers: [DynamicDataService],
  exports: [DynamicDataService],
})
export class DynamicDataModule {}
