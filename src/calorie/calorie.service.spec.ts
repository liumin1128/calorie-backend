import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CalorieService } from './calorie.service';
import { CalorieEntry, CalorieType } from './schemas/calorie-entry.schema';

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
