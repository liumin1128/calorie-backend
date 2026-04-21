import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CalorieService } from './calorie.service';
import { VercelAiClient } from '../vercel-gateway/vercel-ai.client';
import {
  CalorieEntry,
  CalorieType,
  EntrySource,
} from './schemas/calorie-entry.schema';

describe('CalorieService - commentOnEntry', () => {
  let service: CalorieService;
  let mockModel: any;
  let mockAiClient: { chatWithModel: jest.Mock };

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
          }),
        }),
      }),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      aggregate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    };
    mockAiClient = {
      chatWithModel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieService,
        { provide: getModelToken(CalorieEntry.name), useValue: mockModel },
        { provide: VercelAiClient, useValue: mockAiClient },
      ],
    }).compile();

    service = module.get<CalorieService>(CalorieService);
  });

  it('应为饮食记录生成点评', async () => {
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        type: CalorieType.INTAKE,
        title: '炸鸡套餐',
        calories: 900,
        description: '夜宵',
        mealType: 'snack',
        entryDate: new Date('2026-04-21T12:00:00Z'),
      }),
    });
    mockAiClient.chatWithModel.mockResolvedValue(
      '这顿偏油，偶尔解馋可以，下一餐清淡些。',
    );

    const result = await service.commentOnEntry('user-1', 'entry-1');

    expect(result).toEqual({
      comment: '这顿偏油，偶尔解馋可以，下一餐清淡些。',
      model: 'openai/gpt-5.4-nano',
    });
    expect(mockAiClient.chatWithModel).toHaveBeenCalledWith(
      'openai/gpt-5.4-nano',
      expect.arrayContaining([
        expect.objectContaining({ role: 'system' }),
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('记录类型：饮食'),
        }),
      ]),
      { maxTokens: 100 },
    );
  });

  it('应为运动记录生成点评', async () => {
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        type: CalorieType.BURN,
        title: '跑步',
        calories: 360,
        description: '晚饭后慢跑',
        duration: 35,
        entryDate: new Date('2026-04-21T12:00:00Z'),
      }),
    });
    mockAiClient.chatWithModel.mockResolvedValue(
      '节奏不错，持续保持，这次运动很加分。',
    );

    const result = await service.commentOnEntry('user-1', 'entry-1');

    expect(result.comment).toBe('节奏不错，持续保持，这次运动很加分。');
    expect(mockAiClient.chatWithModel.mock.calls[0][1][1].content).toContain(
      '时长：35 分钟',
    );
  });

  it('条目不存在时应抛出 404', async () => {
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await expect(service.commentOnEntry('user-1', 'entry-1')).rejects.toThrow(
      '条目不存在',
    );
    expect(mockAiClient.chatWithModel).not.toHaveBeenCalled();
  });

  it('AI 返回空白内容时应抛出 502', async () => {
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        type: CalorieType.INTAKE,
        title: '沙拉',
        calories: 220,
        entryDate: new Date('2026-04-21T12:00:00Z'),
      }),
    });
    mockAiClient.chatWithModel.mockResolvedValue('   ');

    await expect(service.commentOnEntry('user-1', 'entry-1')).rejects.toThrow(
      'AI 点评暂时不可用',
    );
  });

  it('应规范化寒暄、换行和超长文本', async () => {
    mockModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        type: CalorieType.INTAKE,
        title: '蔬菜碗',
        calories: 280,
        entryDate: new Date('2026-04-21T12:00:00Z'),
      }),
    });
    mockAiClient.chatWithModel.mockResolvedValue(
      '你好，\n这顿搭配清爽均衡，继续保持这样的选择，长期更容易稳住热量。',
    );

    const result = await service.commentOnEntry('user-1', 'entry-1');

    expect(result.comment).toBe(
      '这顿搭配清爽均衡，继续保持这样的选择，长期更容易稳住热量。',
    );
    expect(result.comment.length).toBeLessThanOrEqual(40);
  });
});

describe('CalorieService - getDailySummary', () => {
  let service: CalorieService;
  let mockAggregate: jest.Mock;
  let mockAiClient: { chatWithModel: jest.Mock };

  beforeEach(async () => {
    mockAggregate = jest.fn().mockReturnValue({ exec: jest.fn() });
    mockAiClient = { chatWithModel: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieService,
        {
          provide: getModelToken(CalorieEntry.name),
          useValue: {
            aggregate: mockAggregate,
            create: jest.fn(),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({ exec: jest.fn() }),
                }),
              }),
            }),
            findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
            findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
            findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
            countDocuments: jest.fn().mockReturnValue({ exec: jest.fn() }),
          },
        },
        { provide: VercelAiClient, useValue: mockAiClient },
      ],
    }).compile();

    service = module.get<CalorieService>(CalorieService);
  });

  it('应正确按天汇总 intake 和 burn 数据', async () => {
    mockAggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        { _id: { date: '2026-03-01', type: CalorieType.INTAKE }, total: 800 },
        { _id: { date: '2026-03-01', type: CalorieType.BURN }, total: 200 },
        { _id: { date: '2026-03-02', type: CalorieType.INTAKE }, total: 400 },
      ]),
    });

    const result = await service.getDailySummary('507f1f77bcf86cd799439011', {
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });

    expect(result).toEqual({
      '2026-03-01': { totalIntake: 800, totalBurn: 200 },
      '2026-03-02': { totalIntake: 400, totalBurn: 0 },
    });
  });

  it('范围内无数据时应返回空对象', async () => {
    mockAggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    const result = await service.getDailySummary('507f1f77bcf86cd799439011', {
      startDate: '2026-04-01',
      endDate: '2026-04-07',
    });

    expect(result).toEqual({});
  });

  it('应使用正确的 userId 进行 $match 过滤', async () => {
    mockAggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    const userId = '507f1f77bcf86cd799439011';
    await service.getDailySummary(userId, {
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });

    const pipeline = mockAggregate.mock.calls[0][0];
    expect(pipeline[0].$match.userId).toBe(userId);
  });

  it('应使用正确的日期范围进行 $match 过滤', async () => {
    mockAggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    await service.getDailySummary('507f1f77bcf86cd799439011', {
      startDate: '2026-03-01',
      endDate: '2026-03-07',
    });

    const pipeline = mockAggregate.mock.calls[0][0];
    const matchDate = pipeline[0].$match.entryDate;
    expect(matchDate.$gte).toEqual(new Date('2026-03-01'));
    expect(matchDate.$lte).toEqual(new Date('2026-03-07T23:59:59.999Z'));
  });
});

describe('CalorieService - source 字段', () => {
  let service: CalorieService;
  let mockModel: any;
  let mockAiClient: { chatWithModel: jest.Mock };

  beforeEach(async () => {
    mockAiClient = { chatWithModel: jest.fn() };
    mockModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
          }),
        }),
      }),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      aggregate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOneAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieService,
        { provide: getModelToken(CalorieEntry.name), useValue: mockModel },
        { provide: VercelAiClient, useValue: mockAiClient },
      ],
    }).compile();

    service = module.get<CalorieService>(CalorieService);
  });

  it('创建条目时应通过 upsert 传递 source 字段', async () => {
    const mockEntry = { source: EntrySource.HEALTHKIT };
    mockModel.findOneAndUpdate.mockResolvedValueOnce({
      value: mockEntry,
      lastErrorObject: { upserted: 'new-id' },
    });

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 500,
      title: '午餐',
      entryDate: '2026-04-01T12:00:00Z',
      source: EntrySource.HEALTHKIT,
      externalId: 'hk-uuid-001',
    });

    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'userId', externalId: 'hk-uuid-001' },
      { $set: expect.objectContaining({ source: EntrySource.HEALTHKIT }) },
      { returnDocument: 'after', upsert: true, includeResultMetadata: true },
    );
    expect(result.data).toEqual(mockEntry);
    expect(result.isNew).toBe(true);
  });

  it('按 source=manual 查询时应直接匹配', async () => {
    await service.findAll('userId', { source: EntrySource.MANUAL });

    const filter = mockModel.find.mock.calls[0][0];
    expect(filter.source).toBe(EntrySource.MANUAL);
  });

  it('按 source=healthkit 查询时应直接匹配', async () => {
    await service.findAll('userId', { source: EntrySource.HEALTHKIT });

    const filter = mockModel.find.mock.calls[0][0];
    expect(filter.source).toBe(EntrySource.HEALTHKIT);
    expect(filter.$or).toBeUndefined();
  });

  it('不指定 source 查询时不应添加 source 过滤', async () => {
    await service.findAll('userId', {});

    const filter = mockModel.find.mock.calls[0][0];
    expect(filter.source).toBeUndefined();
    expect(filter.$or).toBeUndefined();
  });
});

describe('CalorieService - externalId 去重', () => {
  let service: CalorieService;
  let mockModel: any;
  let mockAiClient: { chatWithModel: jest.Mock };

  beforeEach(async () => {
    mockAiClient = { chatWithModel: jest.fn() };
    mockModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
          }),
        }),
      }),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      aggregate: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOne: jest.fn().mockReturnValue({ exec: jest.fn() }),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn().mockReturnValue({ exec: jest.fn() }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalorieService,
        { provide: getModelToken(CalorieEntry.name), useValue: mockModel },
        { provide: VercelAiClient, useValue: mockAiClient },
      ],
    }).compile();

    service = module.get<CalorieService>(CalorieService);
  });

  it('有 externalId 且首次创建应返回 isNew=true', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue({
      value: { _id: 'new-id', externalId: 'hk-001' },
      lastErrorObject: { upserted: 'new-id' },
    });

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 500,
      title: '午餐',
      entryDate: '2026-04-01T12:00:00Z',
      externalId: 'hk-001',
    });

    expect(result.isNew).toBe(true);
    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'userId', externalId: 'hk-001' },
      expect.any(Object),
      { returnDocument: 'after', upsert: true, includeResultMetadata: true },
    );
  });

  it('有 externalId 且重复应返回 isNew=false', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue({
      value: { _id: 'existing-id', calories: 600 },
      lastErrorObject: { updatedExisting: true },
    });

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 600,
      title: '午餐（修正）',
      entryDate: '2026-04-01T12:00:00Z',
      externalId: 'hk-001',
    });

    expect(result.isNew).toBe(false);
  });

  it('无 externalId 应走普通创建并返回 isNew=true', async () => {
    const mockEntry = { _id: 'new-id', calories: 500 };
    mockModel.create.mockResolvedValue(mockEntry);

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 500,
      title: '午餐',
      entryDate: '2026-04-01T12:00:00Z',
    });

    expect(result.isNew).toBe(true);
    expect(result.data).toEqual(mockEntry);
    expect(mockModel.create).toHaveBeenCalled();
    expect(mockModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
