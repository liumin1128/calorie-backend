import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CalorieModule } from './calorie/calorie.module';
import { UserModule } from './user/user.module';
import { DynamicDataModule } from './dynamic-data/dynamic-data.module';
import { VercelGatewayModule } from './vercel-gateway/vercel-gateway.module';
import { FoodModule } from './food/food.module';
import { StorageModule } from './storage/storage.module';
import { WaterModule } from './water/water.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
    AuthModule,
    CalorieModule,
    UserModule,
    DynamicDataModule,
    VercelGatewayModule,
    FoodModule,
    StorageModule,
    WaterModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
