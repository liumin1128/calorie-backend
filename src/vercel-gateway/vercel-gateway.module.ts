import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalorieModule } from '../calorie/calorie.module';
import { UserModule } from '../user/user.module';
import { VercelGatewayController } from './vercel-gateway.controller';
import { VercelGatewayService } from './vercel-gateway.service';

@Module({
  imports: [HttpModule, UserModule, CalorieModule],
  controllers: [VercelGatewayController],
  providers: [VercelGatewayService],
})
export class VercelGatewayModule {}
