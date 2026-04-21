import { HttpException, HttpStatus } from '@nestjs/common';
import { VercelGatewayService } from './vercel-gateway.service';

describe('VercelGatewayService - analyzeImageNutrition', () => {
  let service: VercelGatewayService;
  let mockAiClient: {
    chatWithModel: jest.Mock;
    chat?: jest.Mock;
    model: string;
  };

  beforeEach(() => {
    mockAiClient = {
      chatWithModel: jest.fn(),
      model: 'deepseek/deepseek-v3.2',
    };

    service = new VercelGatewayService(
      mockAiClient as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  const createMockFile = (mimetype = 'image/jpeg'): Express.Multer.File => ({
    buffer: Buffer.from('fake-image-data'),
    mimetype,
    fieldname: 'image',
    originalname: 'food.jpg',
    encoding: '7bit',
    size: 1024,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  });

  it('应将图片转为 Base64 data URL 并调用 chatWithModel', async () => {
    const mockResponse = JSON.stringify({
      foods: [
        {
          name: '米饭',
          calories: 200,
          water: 120,
          nutrition: {
            protein: 4,
            fat: 0.5,
            carbohydrates: 45,
            fiber: 0.3,
          },
          minerals: {
            sodium: 2,
          },
          unit: '碗',
          quantity: 1,
        },
      ],
      summary: '一碗白米饭',
    });
    mockAiClient.chatWithModel.mockResolvedValue(mockResponse);

    const file = createMockFile();
    const result = await service.analyzeImageNutrition(file);

    // 验证调用参数
    expect(mockAiClient.chatWithModel).toHaveBeenCalledWith(
      'openai/gpt-5-nano',
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({
          role: 'user',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'image_url',
              image_url: {
                url: expect.stringContaining('data:image/jpeg;base64,'),
              },
            }),
            expect.objectContaining({ type: 'text' }),
          ]),
        }),
      ]),
      expect.objectContaining({
        maxTokens: 4096,
        reasoning: { effort: 'minimal' },
      }),
    );

    // 验证返回结构
    expect(result.foods).toHaveLength(1);
    expect(result.foods[0].name).toBe('米饭');
    expect(result.model).toBe('openai/gpt-5-nano (fast)');
    expect(result.summary).toBe('一碗白米饭');
  });

  it('AI 返回非法 JSON 时应抛出 502', async () => {
    mockAiClient.chatWithModel.mockResolvedValue('这不是JSON');

    const file = createMockFile();
    await expect(service.analyzeImageNutrition(file)).rejects.toThrow(
      new HttpException('AI 返回内容解析失败', HttpStatus.BAD_GATEWAY),
    );
  });

  it('复杂图片时应继续调用深度模型并返回结果', async () => {
    mockAiClient.chatWithModel
      .mockResolvedValueOnce(
        JSON.stringify({ complex: true, reason: '主体过多' }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          foods: [
            {
              name: '沙拉',
              calories: 180,
              water: 90,
              nutrition: {
                protein: 8,
                fat: 6,
                carbohydrates: 20,
                fiber: 4,
              },
              minerals: {
                sodium: 120,
              },
              unit: '份',
              quantity: 1,
            },
          ],
          summary: '一份清爽沙拉',
        }),
      );

    const file = createMockFile();
    const result = await service.analyzeImageNutrition(file);

    expect(mockAiClient.chatWithModel).toHaveBeenNthCalledWith(
      2,
      'google/gemini-2.5-flash-image',
      expect.any(Array),
      expect.objectContaining({ maxTokens: 16384, timeout: 120000 }),
    );
    expect(result.foods).toHaveLength(1);
    expect(result.summary).toBe('一份清爽沙拉');
    expect(result.model).toBe('google/gemini-2.5-flash-image (deep)');
  });

  it('ping 应返回当前模型', () => {
    const result = service.ping();

    expect(result).toEqual({
      status: 'ok',
      gateway: 'vercel-ai-gateway',
      model: 'deepseek/deepseek-v3.2',
    });
  });

  it('getSuggestion 应继续通过 aiClient.chat 生成建议', async () => {
    mockAiClient.chat = jest
      .fn()
      .mockResolvedValue('继续保持，晚餐注意蛋白质搭配。');
    service = new VercelGatewayService(
      mockAiClient as any,
      {} as any,
      {
        getFullProfile: jest.fn().mockResolvedValue({
          latestHeight: { value: 170 },
          latestWeight: { value: 65 },
          targetWeight: 60,
          healthConditions: ['轻度高血脂'],
        }),
      } as any,
      {
        summarizeLast7Days: jest.fn().mockResolvedValue({
          intakeTotal: 2400,
          intakeCount: 3,
          burnTotal: 600,
          burnCount: 2,
          daysWithData: 2,
          intakeEntries: [
            {
              title: '鸡胸肉沙拉',
              calories: 420,
              description: '午餐',
              entryDate: new Date('2026-04-21T12:00:00Z'),
            },
          ],
          burnEntries: [
            {
              title: '快走',
              calories: 300,
              description: '饭后运动',
              entryDate: new Date('2026-04-21T18:00:00Z'),
            },
          ],
        }),
      } as any,
    );

    const result = await service.getSuggestion('user-1', '我今天吃得怎么样？');

    expect(mockAiClient.chat).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('我的问题：我今天吃得怎么样？'),
        }),
      ]),
      800,
    );
    expect(result).toEqual({
      suggestion: '继续保持，晚餐注意蛋白质搭配。',
      model: 'deepseek/deepseek-v3.2',
    });
  });
});
