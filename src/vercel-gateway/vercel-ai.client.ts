import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ChatMessage {
  role: string;
  content: string;
}

@Injectable()
export class VercelAiClient {
  private readonly token: string;
  private readonly baseUrl: string;
  readonly model: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.get<string>('VERCEL_AI_TOKEN');
    if (!token) {
      throw new Error('VERCEL_AI_TOKEN is not configured');
    }
    this.token = token;

    const configuredBaseUrl =
      this.configService.get<string>('VERCEL_AI_GATEWAY_URL') ??
      'https://ai-gateway.vercel.sh';
    this.baseUrl = configuredBaseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');

    this.model =
      this.configService.get<string>('VERCEL_AI_MODEL') ??
      'deepseek/deepseek-v3.2';
  }

  /**
   * 通用 HTTP 基础方法：注入认证头、统一错误处理、30秒超时
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.baseUrl}${path}`,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          data: body,
          timeout: 30000,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      const status =
        (error as { response?: { status?: number } })?.response?.status ??
        HttpStatus.BAD_GATEWAY;
      throw new HttpException('AI 网关请求失败', status);
    }
  }

  /**
   * 发起 chat 对话请求
   * @param messages 消息列表（OpenAI Chat Completions 格式）
   * @param maxTokens 最大 token 数，默认 800
   * @returns AI 回复文本
   */
  async chat(messages: ChatMessage[], maxTokens = 800): Promise<string> {
    const result = await this.request<{
      choices: { message: { content: string } }[];
    }>('POST', '/v1/chat/completions', {
      model: this.model,
      messages,
      max_tokens: maxTokens,
    });
    return result?.choices?.[0]?.message?.content ?? '';
  }
}
