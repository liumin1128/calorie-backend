import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VercelAiClient } from '../vercel-gateway/vercel-ai.client';

@Module({
  imports: [HttpModule],
  providers: [VercelAiClient],
  exports: [VercelAiClient],
})
export class AiModule {}
