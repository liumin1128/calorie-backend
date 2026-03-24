import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DynamicDataService } from './dynamic-data.service';
import { DynamicData } from './schemas/dynamic-data.schema';

describe('DynamicDataService', () => {
  let service: DynamicDataService;

  const mockDynamicDataModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicDataService,
        {
          provide: getModelToken(DynamicData.name),
          useValue: mockDynamicDataModel,
        },
      ],
    }).compile();

    service = module.get<DynamicDataService>(DynamicDataService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a dynamic data record with default recordedAt', async () => {
      const dto = { category: 'height', value: 175.5 };
      mockDynamicDataModel.create.mockResolvedValue({
        userId: new Types.ObjectId(),
        ...dto,
        recordedAt: new Date(),
      });

      await service.create('507f1f77bcf86cd799439011', dto);
      expect(mockDynamicDataModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'height',
          value: 175.5,
        }),
      );
    });

    it('should create with specified recordedAt', async () => {
      const dto = {
        category: 'weight',
        value: 70.0,
        recordedAt: '2026-03-20T08:00:00Z',
      };
      mockDynamicDataModel.create.mockResolvedValue({ ...dto });

      await service.create('507f1f77bcf86cd799439011', dto);
      expect(mockDynamicDataModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'weight',
          value: 70.0,
          recordedAt: new Date('2026-03-20T08:00:00Z'),
        }),
      );
    });
  });

  describe('findLatest', () => {
    it('should query with $lte (截止到该日期) and sort by recordedAt desc', async () => {
      const mockResult = { category: 'weight', value: 70.5 };
      mockDynamicDataModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockResult),
      });

      const result = await service.findLatest(
        '507f1f77bcf86cd799439011',
        'weight',
        new Date('2026-03-20'),
      );

      const callArg = mockDynamicDataModel.findOne.mock.calls[0][0];
      expect(callArg.category).toBe('weight');
      expect(callArg.recordedAt.$lte).toBeDefined();
      expect(callArg.recordedAt.$gte).toBeUndefined();
      expect(result).toEqual(mockResult);
    });

    it('should return null when no data found', async () => {
      mockDynamicDataModel.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findLatest(
        '507f1f77bcf86cd799439011',
        'height',
      );
      expect(result).toBeNull();
    });
  });

  describe('findTrend', () => {
    it('should return trend data sorted by date', async () => {
      const mockResults = [
        { date: '2026-03-17', value: 70.5, recordedAt: new Date() },
        { date: '2026-03-18', value: 70.2, recordedAt: new Date() },
      ];
      mockDynamicDataModel.aggregate.mockResolvedValue(mockResults);

      const result = await service.findTrend(
        '507f1f77bcf86cd799439011',
        'weight',
        new Date('2026-03-17'),
        new Date('2026-03-23'),
      );

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-03-17');
    });

    it('should return empty array when no data in range', async () => {
      mockDynamicDataModel.aggregate.mockResolvedValue([]);

      const result = await service.findTrend(
        '507f1f77bcf86cd799439011',
        'weight',
        new Date('2026-01-01'),
        new Date('2026-01-07'),
      );
      expect(result).toEqual([]);
    });
  });

  describe('findLatestByCategories', () => {
    it('should return map of latest values per category', async () => {
      const now = new Date();
      mockDynamicDataModel.aggregate.mockResolvedValue([
        { _id: 'height', value: 175.5, recordedAt: now },
        { _id: 'weight', value: 70.2, recordedAt: now },
      ]);

      const result = await service.findLatestByCategories(
        '507f1f77bcf86cd799439011',
        ['height', 'weight'],
      );

      expect(result.get('height')).toEqual({ value: 175.5, recordedAt: now });
      expect(result.get('weight')).toEqual({ value: 70.2, recordedAt: now });
    });

    it('should return empty map when no data exists', async () => {
      mockDynamicDataModel.aggregate.mockResolvedValue([]);

      const result = await service.findLatestByCategories(
        '507f1f77bcf86cd799439011',
        ['height', 'weight'],
      );
      expect(result.size).toBe(0);
    });

    it('should include recordedAt $lte condition when beforeDate is provided', async () => {
      const beforeDate = new Date('2026-03-15T23:59:59.999Z');
      mockDynamicDataModel.aggregate.mockResolvedValue([
        { _id: 'height', value: 170.0, recordedAt: new Date('2026-03-10') },
      ]);

      const result = await service.findLatestByCategories(
        '507f1f77bcf86cd799439011',
        ['height', 'weight'],
        beforeDate,
      );

      const matchStage =
        mockDynamicDataModel.aggregate.mock.calls[0][0][0].$match;
      expect(matchStage.recordedAt).toEqual({ $lte: beforeDate });
      expect(result.get('height')).toEqual({
        value: 170.0,
        recordedAt: new Date('2026-03-10'),
      });
    });

    it('should not include recordedAt condition when beforeDate is omitted', async () => {
      mockDynamicDataModel.aggregate.mockResolvedValue([]);

      await service.findLatestByCategories('507f1f77bcf86cd799439011', [
        'height',
      ]);

      const matchStage =
        mockDynamicDataModel.aggregate.mock.calls[0][0][0].$match;
      expect(matchStage.recordedAt).toBeUndefined();
    });
  });
});
