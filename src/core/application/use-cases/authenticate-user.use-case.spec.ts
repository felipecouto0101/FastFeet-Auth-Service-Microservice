import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { PasswordService } from '../../domain/services/password.service';
import { SQSService } from '../../../infrastructure/messaging/sqs.service';
import { DeliverymanMessagingService } from '../../../infrastructure/messaging/deliveryman-messaging.service';
import { LoginDto } from '../dtos/login.dto';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let passwordService: jest.Mocked<PasswordService>;
  let sqsService: jest.Mocked<SQSService>;
  let deliverymanMessaging: jest.Mocked<DeliverymanMessagingService>;

  beforeEach(async () => {
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
  });

  it('should authenticate user successfully', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'password123',
    };

    const deliverymanResponse = {
      requestId: 'test-request-id',
      deliveryman: {
        id: 'user-id',
        cpf: '12345678901',
        name: 'Test User',
        email: 'test@email.com',
        password: 'hashedPassword',
        isActive: true,
      },
    };

    deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
    deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(deliverymanResponse);
    passwordService.compare.mockResolvedValue(true);
    sqsService.sendAuthEvent.mockResolvedValue();

    const result = await useCase.execute(loginDto);

    expect(result).toEqual({
      access_token: expect.any(String),
      user: {
        id: 'user-id',
        cpf: '12345678901',
        name: 'Test User',
        email: 'test@email.com',
        role: 'deliveryman',
      },
    });

    expect(sqsService.sendAuthEvent).toHaveBeenCalledWith({
      eventType: 'USER_AUTHENTICATED',
      userId: 'user-id',
      cpf: '12345678901',
      role: 'deliveryman',
      timestamp: expect.any(String),
    });
  });

  it('should throw UnauthorizedException when deliveryman not found', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'password123',
    };

    deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
    deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(null);

    await expect(useCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'wrongpassword',
    };

    const deliverymanResponse = {
      requestId: 'test-request-id',
      deliveryman: {
        id: 'user-id',
        cpf: '12345678901',
        name: 'Test User',
        email: 'test@email.com',
        password: 'hashedPassword',
        isActive: true,
      },
    };

    deliverymanMessaging.requestDeliverymanData.mockResolvedValue();
    deliverymanMessaging.waitForDeliverymanResponse.mockResolvedValue(deliverymanResponse);
    passwordService.compare.mockResolvedValue(false);

    await expect(useCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});