import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CalorieModule } from './calorie/calorie.module';
import { UserModule } from './user/user.module';
import { DynamicDataModule } from './dynamic-data/dynamic-data.module';
import { VercelGatewayModule } from './vercel-gateway/vercel-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    CalorieModule,
    UserModule,
    DynamicDataModule,
    VercelGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
