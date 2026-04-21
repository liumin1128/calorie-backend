import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CalorieModule } from '../calorie/calorie.module';
import { UserModule } from '../user/user.module';
import { VercelGatewayController } from './vercel-gateway.controller';
import { VercelGatewayService } from './vercel-gateway.service';

@Module({
  imports: [AiModule, UserModule, CalorieModule],
  controllers: [VercelGatewayController],
  providers: [VercelGatewayService],
})
export class VercelGatewayModule {}
