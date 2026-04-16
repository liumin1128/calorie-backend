import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WaterService } from './water.service';
import { WaterIntake } from './schemas/water-intake.schema';

describe('WaterService', () => {
  let service: WaterService;
  let mockFindOneAndUpdate: jest.Mock;
  let mockFind: jest.Mock;

  beforeEach(async () => {
    mockFindOneAndUpdate = jest.fn();
    mockFind = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaterService,
        {
          provide: getModelToken(WaterIntake.name),
          useValue: {
            findOneAndUpdate: mockFindOneAndUpdate,
            find: mockFind,
          },
        },
      ],
    }).compile();

    service = module.get<WaterService>(WaterService);
  });

  describe('setWater', () => {
    it('应使用 upsert 模式设置饮水量', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        date: '2026-04-16',
        amount: 1500,
      });

      const result = await service.setWater('user123', {
        date: '2026-04-16',
        amount: 1500,
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123', date: '2026-04-16' },
        { $set: { amount: 1500 } },
        { upsert: true, returnDocument: 'after' },
      );
      expect(result).toEqual({ date: '2026-04-16', amount: 1500 });
    });

    it('应支持将饮水量设为 0', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        date: '2026-04-16',
        amount: 0,
      });

      const result = await service.setWater('user123', {
        date: '2026-04-16',
        amount: 0,
      });

      expect(result).toEqual({ date: '2026-04-16', amount: 0 });
    });

    it('覆盖更新已有记录', async () => {
      mockFindOneAndUpdate.mockResolvedValue({
        date: '2026-04-16',
        amount: 2000,
      });

      const result = await service.setWater('user123', {
        date: '2026-04-16',
        amount: 2000,
      });

      expect(result).toEqual({ date: '2026-04-16', amount: 2000 });
    });
  });

  describe('getWater', () => {
    it('应查询日期范围内的饮水记录并按 date 升序返回', async () => {
      const mockRecords = [
        { date: '2026-04-10', amount: 1500 },
        { date: '2026-04-12', amount: 2000 },
      ];

      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      const result = await service.getWater('user123', {
        startDate: '2026-04-10',
        endDate: '2026-04-16',
      });

      expect(mockFind).toHaveBeenCalledWith({
        userId: 'user123',
        date: { $gte: '2026-04-10', $lte: '2026-04-16' },
      });
      expect(result).toEqual({ data: mockRecords });
    });

    it('无数据时应返回空数组', async () => {
      mockFind.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.getWater('user123', {
        startDate: '2026-04-01',
        endDate: '2026-04-07',
      });

      expect(result).toEqual({ data: [] });
    });
  });
});
