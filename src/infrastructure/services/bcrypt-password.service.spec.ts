import { Test, TestingModule } from '@nestjs/testing';
import { BcryptPasswordService } from './bcrypt-password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('BcryptPasswordService', () => {
  let service: BcryptPasswordService;
  let mockBcrypt: jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [BcryptPasswordService],
    }).compile();

    service = module.get<BcryptPasswordService>(BcryptPasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedPassword';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.hash(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should throw error when bcrypt.hash fails', async () => {
      const password = 'testPassword123';
      const error = new Error('Hashing failed');

      mockBcrypt.hash.mockRejectedValue(error as never);

      await expect(service.hash(password)).rejects.toThrow('Hashing failed');
    });
  });

  describe('compare', () => {
    it('should return true when passwords match', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedPassword';

      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.compare(password, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedPassword';

      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.compare(password, hashedPassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(false);
    });

    it('should throw error when bcrypt.compare fails', async () => {
      const password = 'testPassword123';
      const hashedPassword = '$2b$10$hashedPassword';
      const error = new Error('Comparison failed');

      mockBcrypt.compare.mockRejectedValue(error as never);

      await expect(service.compare(password, hashedPassword)).rejects.toThrow('Comparison failed');
    });
  });
});