import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthenticateUserUseCase } from './authenticate-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { SQSService } from '../../../infrastructure/messaging/sqs.service';
import { User, UserRole } from '../../domain/entities/user.entity';
import { LoginDto } from '../dtos/login.dto';

describe('AuthenticateUserUseCase', () => {
  let useCase: AuthenticateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let jwtService: jest.Mocked<JwtService>;
  let sqsService: jest.Mocked<SQSService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            findByCpf: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: SQSService,
          useValue: {
            sendAuthEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<AuthenticateUserUseCase>(AuthenticateUserUseCase);
    userRepository = module.get(UserRepository);
    passwordService = module.get(PasswordService);
    jwtService = module.get(JwtService);
    sqsService = module.get(SQSService);
  });

  it('should authenticate user successfully', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'password123',
    };

    const user = new User(
      'user-id',
      '12345678901',
      'Test User',
      'test@email.com',
      'hashedPassword',
      UserRole.DELIVERYMAN,
    );

    userRepository.findByCpf.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(true);
    jwtService.sign.mockReturnValue('jwt-token');
    sqsService.sendAuthEvent.mockResolvedValue();

    const result = await useCase.execute(loginDto);

    expect(result).toEqual({
      access_token: 'jwt-token',
      user: {
        id: 'user-id',
        cpf: '12345678901',
        name: 'Test User',
        email: 'test@email.com',
        role: UserRole.DELIVERYMAN,
      },
    });

    expect(sqsService.sendAuthEvent).toHaveBeenCalledWith({
      eventType: 'USER_AUTHENTICATED',
      userId: 'user-id',
      cpf: '12345678901',
      role: UserRole.DELIVERYMAN,
      timestamp: expect.any(String),
    });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'password123',
    };

    userRepository.findByCpf.mockResolvedValue(null);

    await expect(useCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const loginDto: LoginDto = {
      cpf: '12345678901',
      password: 'wrongpassword',
    };

    const user = new User(
      'user-id',
      '12345678901',
      'Test User',
      'test@email.com',
      'hashedPassword',
      UserRole.DELIVERYMAN,
    );

    userRepository.findByCpf.mockResolvedValue(user);
    passwordService.compare.mockResolvedValue(false);

    await expect(useCase.execute(loginDto)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});