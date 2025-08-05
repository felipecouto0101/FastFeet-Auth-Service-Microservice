import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { PasswordService } from '../../domain/services/password.service';
import { SQSService } from '../../../infrastructure/messaging/sqs.service';
import { DeliverymanMessagingService } from '../../../infrastructure/messaging/deliveryman-messaging.service';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let passwordService: jest.Mocked<PasswordService>;
  let sqsService: jest.Mocked<SQSService>;
  let deliverymanMessaging: jest.Mocked<DeliverymanMessagingService>;
  let mockJwt: jest.Mocked<typeof jwt>;

  beforeEach(async () => {
    mockJwt = jwt as jest.Mocked<typeof jwt>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
        {
          provide: PasswordService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: SQSService,
          useValue: {
            sendAuthEvent: jest.fn(),
          },
        },
        {
          provide: DeliverymanMessagingService,
          useValue: {
            requestDeliverymanData: jest.fn(),
            waitForDeliverymanResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<AuthenticateUserUseCase>(AuthenticateUserUseCase);
    passwordService = module.get(PasswordService);
    sqsService = module.get(SQSService);
    deliverymanMessaging = module.get(DeliverymanMessagingService);

   
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('execute', () => {
    const loginDto = {
      cpf: '123.456.789-01',
      password: 'testPassword123',
    };

    const mockDeliverymanResponse = {
      requestId: 'test-uuid',
      deliveryman: {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        cpf: '123.456.789-01',
        password: '$2b$10$hashedPassword',
        phone: '(11) 99999-9999',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    };

    it('should authenticate user successfully', async () => {
      const mockToken = 'mock-jwt-token';

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(mockDeliverymanResponse);
      passwordService.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue(mockToken as any);
      sqsService.sendAuthEvent.mockResolvedValue();

      const result = await useCase.execute(loginDto);

      expect(deliverymanMessaging.requestDeliverymanData).toHaveBeenCalledWith({
        cpf: loginDto.cpf,
        requestId: 'test-uuid',
      });

      expect(deliverymanMessaging.waitForDeliverymanResponse).toHaveBeenCalledWith('test-uuid', 30000);

      expect(passwordService.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockDeliverymanResponse.deliveryman.password
      );

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          sub: mockDeliverymanResponse.deliveryman.id,
          cpf: mockDeliverymanResponse.deliveryman.cpf,
          role: 'deliveryman',
        },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(sqsService.sendAuthEvent).toHaveBeenCalledWith({
        eventType: 'USER_AUTHENTICATED',
        userId: mockDeliverymanResponse.deliveryman.id,
        cpf: mockDeliverymanResponse.deliveryman.cpf,
        role: 'deliveryman',
        timestamp: expect.any(String),
      });

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: mockDeliverymanResponse.deliveryman.id,
          cpf: mockDeliverymanResponse.deliveryman.cpf,
          role: 'deliveryman',
        },
      });
    });

    it('should throw UnauthorizedException when no response from deliveryman service', async () => {
      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(null);

      await expect(useCase.execute(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when response has error', async () => {
      const errorResponse = {
        requestId: 'test-uuid',
        error: 'Deliveryman not found',
      };

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(errorResponse as any);

      await expect(useCase.execute(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when deliveryman is not active', async () => {
      const inactiveDeliverymanResponse = {
        ...mockDeliverymanResponse,
        deliveryman: {
          ...mockDeliverymanResponse.deliveryman,
          isActive: false,
        },
      };

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(inactiveDeliverymanResponse);

      await expect(useCase.execute(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password field is missing', async () => {
      const responseWithoutPassword = {
        ...mockDeliverymanResponse,
        deliveryman: {
          ...mockDeliverymanResponse.deliveryman,
          password: undefined,
        },
      };

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(responseWithoutPassword as any);

      await expect(useCase.execute(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(mockDeliverymanResponse);
      passwordService.compare.mockResolvedValue(false);

      await expect(useCase.execute(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(useCase.execute(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should use default JWT secret when environment variable is not set', async () => {
      delete process.env.JWT_SECRET;
      const mockToken = 'mock-jwt-token';

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(mockDeliverymanResponse);
      passwordService.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue(mockToken as any);
      sqsService.sendAuthEvent.mockResolvedValue();

      await useCase.execute(loginDto);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'default-secret',
        { expiresIn: '24h' }
      );
    });

    it('should handle error when requesting deliveryman data fails', async () => {
      const error = new Error('SQS Error');
      deliverymanMessaging.requestDeliverymanData.mockRejectedValue(error);

      await expect(useCase.execute(loginDto)).rejects.toThrow('SQS Error');
    });

    it('should handle error when password comparison fails', async () => {
      const error = new Error('Password comparison failed');

      deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
      deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(mockDeliverymanResponse);
      passwordService.compare.mockRejectedValue(error);

      await expect(useCase.execute(loginDto)).rejects.toThrow('Password comparison failed');
    });
  });
});