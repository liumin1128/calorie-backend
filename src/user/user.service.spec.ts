import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User } from '../auth/schemas/user.schema';
import { DynamicDataService } from '../dynamic-data/dynamic-data.service';

describe('UserService', () => {
  let service: UserService;

  const mockUserModel = {
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  };

  const mockDynamicDataService = {
    findLatestByCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: DynamicDataService, useValue: mockDynamicDataService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update user profile and return without password', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        nickname: 'test',
        gender: 'male',
      };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.updateProfile('user-id', {
        gender: 'male' as any,
      });

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user-id',
        { $set: { gender: 'male' } },
        { returnDocument: 'after' },
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle empty dto (no changes)', async () => {
      const mockUser = { _id: 'user-id', email: 'test@test.com' };
      mockUserModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.updateProfile('user-id', {});
      expect(result).toEqual(mockUser);
    });
  });

  describe('getFullProfile', () => {
    it('should return full profile with latest dynamic data', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        nickname: 'test',
        gender: 'male',
        birthday: new Date('1995-06-15'),
        signature: 'hello',
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const dynamicMap = new Map();
      dynamicMap.set('height', { value: 175.5, recordedAt: new Date() });
      dynamicMap.set('weight', { value: 70.2, recordedAt: new Date() });
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        dynamicMap,
      );

      const result = await service.getFullProfile('user-id');
      expect(result).toMatchObject({
        email: 'test@test.com',
        latestHeight: { value: 175.5 },
        latestWeight: { value: 70.2 },
      });
    });

    it('should return null for dynamic data when not available', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        nickname: 'test',
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        new Map(),
      );

      const result = await service.getFullProfile('user-id');
      expect(result?.latestHeight).toBeNull();
      expect(result?.latestWeight).toBeNull();
    });

    it('should pass beforeDate (end of day) when date is provided', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        nickname: 'test',
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        new Map(),
      );

      const queryDate = new Date('2026-03-15');
      await service.getFullProfile('user-id', queryDate);

      const beforeDate =
        mockDynamicDataService.findLatestByCategories.mock.calls[0][2];
      expect(beforeDate).toBeDefined();
      expect(beforeDate.getHours()).toBe(23);
      expect(beforeDate.getMinutes()).toBe(59);
      expect(beforeDate.getSeconds()).toBe(59);
    });

    it('should not pass beforeDate when date is omitted', async () => {
      const mockUser = {
        _id: 'user-id',
        email: 'test@test.com',
        nickname: 'test',
      };
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        new Map(),
      );

      await service.getFullProfile('user-id');

      const beforeDate =
        mockDynamicDataService.findLatestByCategories.mock.calls[0][2];
      expect(beforeDate).toBeUndefined();
    });
  });
});
