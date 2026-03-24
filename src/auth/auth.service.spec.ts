import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { DynamicDataService } from '../dynamic-data/dynamic-data.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockDynamicDataService = {
    findLatestByCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: DynamicDataService, useValue: mockDynamicDataService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('buildResponse (via login)', () => {
    it('should include latest height and weight in login response', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@test.com',
        password: '$2b$10$hashedpassword',
        nickname: 'test',
        gender: 'male',
        birthday: new Date('1995-06-15'),
        signature: 'hello',
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);

      const now = new Date();
      const dynamicMap = new Map();
      dynamicMap.set('height', { value: 175.5, recordedAt: now });
      dynamicMap.set('weight', { value: 70.2, recordedAt: now });
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        dynamicMap,
      );

      // Mock bcrypt.compare
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.latestHeight).toEqual({
        value: 175.5,
        recordedAt: now,
      });
      expect(result.user.latestWeight).toEqual({
        value: 70.2,
        recordedAt: now,
      });
      expect(result.user.gender).toBe('male');
    });

    it('should return null for dynamic data when user has no records', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@test.com',
        password: '$2b$10$hashedpassword',
        nickname: 'test',
      };
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockDynamicDataService.findLatestByCategories.mockResolvedValue(
        new Map(),
      );

      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.user.latestHeight).toBeNull();
      expect(result.user.latestWeight).toBeNull();
    });
  });
});
