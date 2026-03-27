import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalorieModule } from '../calorie/calorie.module';
import { UserModule } from '../user/user.module';
import { VercelGatewayController } from './vercel-gateway.controller';
import { VercelGatewayService } from './vercel-gateway.service';
import { VercelAiClient } from './vercel-ai.client';

@Module({
  imports: [HttpModule, UserModule, CalorieModule],
  controllers: [VercelGatewayController],
  providers: [VercelAiClient, VercelGatewayService],
  exports: [VercelAiClient],
})
export class VercelGatewayModule {}
