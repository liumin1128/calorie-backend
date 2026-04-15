import { HttpException, HttpStatus } from '@nestjs/common';
import { VercelGatewayService } from './vercel-gateway.service';

describe('VercelGatewayService - analyzeImageNutrition', () => {
  let service: VercelGatewayService;
  let mockAiClient: { chatWithModel: jest.Mock; model: string };

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
    expect(result.model).toBe('openai/gpt-5-nano');
    expect(result.summary).toBe('一碗白米饭');
  });

  it('AI 返回非法 JSON 时应抛出 502', async () => {
    mockAiClient.chatWithModel.mockResolvedValue('这不是JSON');

    const file = createMockFile();
    await expect(service.analyzeImageNutrition(file)).rejects.toThrow(
      new HttpException('AI 返回内容解析失败', HttpStatus.BAD_GATEWAY),
    );
  });

  it('AI 返回缺少 foods 字段时应兜底为空数组', async () => {
    mockAiClient.chatWithModel.mockResolvedValue(
      JSON.stringify({ summary: '无食物' }),
    );

    const file = createMockFile();
    const result = await service.analyzeImageNutrition(file);

    expect(result.foods).toEqual([]);
    expect(result.summary).toBe('无食物');
  });
});
