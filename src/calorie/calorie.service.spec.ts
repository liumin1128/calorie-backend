import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CalorieService } from './calorie.service';
import {
  CalorieEntry,
  CalorieType,
  EntrySource,
} from './schemas/calorie-entry.schema';

describe('CalorieService - getDailySummary', () => {
  let service: CalorieService;
  let mockAggregate: jest.Mock;

  beforeEach(async () => {
    mockAggregate = jest.fn().mockReturnValue({ exec: jest.fn() });

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

  beforeEach(async () => {
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
    });

    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        userId: 'userId',
        entryDate: new Date('2026-04-01T12:00:00Z'),
        type: CalorieType.INTAKE,
      },
      { $set: expect.objectContaining({ source: EntrySource.HEALTHKIT }) },
      { new: true, upsert: true, includeResultMetadata: true },
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

describe('CalorieService - upsert 去重', () => {
  let service: CalorieService;
  let mockModel: any;

  beforeEach(async () => {
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
      ],
    }).compile();

    service = module.get<CalorieService>(CalorieService);
  });

  it('首次创建应返回 isNew=true', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue({
      value: { _id: 'new-id', calories: 500 },
      lastErrorObject: { upserted: 'new-id' },
    });

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 500,
      title: '午餐',
      entryDate: '2026-04-01T12:00:00Z',
    });

    expect(result.isNew).toBe(true);
    expect(result.data).toEqual({ _id: 'new-id', calories: 500 });
  });

  it('重复条目应返回 isNew=false', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue({
      value: { _id: 'existing-id', calories: 600 },
      lastErrorObject: { updatedExisting: true },
    });

    const result = await service.create('userId', {
      type: CalorieType.INTAKE,
      calories: 600,
      title: '午餐（修正）',
      entryDate: '2026-04-01T12:00:00Z',
    });

    expect(result.isNew).toBe(false);
    expect(result.data).toEqual({ _id: 'existing-id', calories: 600 });
  });

  it('应以 userId + entryDate + type 为匹配条件', async () => {
    mockModel.findOneAndUpdate.mockResolvedValue({
      value: {},
      lastErrorObject: { upserted: 'id' },
    });

    await service.create('user123', {
      type: CalorieType.BURN,
      calories: 300,
      title: '跑步',
      entryDate: '2026-04-01T18:00:00Z',
    });

    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        userId: 'user123',
        entryDate: new Date('2026-04-01T18:00:00Z'),
        type: CalorieType.BURN,
      },
      expect.any(Object),
      { new: true, upsert: true, includeResultMetadata: true },
    );
  });
});
