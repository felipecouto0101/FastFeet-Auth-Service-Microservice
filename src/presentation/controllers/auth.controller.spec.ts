import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { LoginDto } from '../../core/application/dtos/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authenticateUserUseCase: jest.Mocked<AuthenticateUserUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthenticateUserUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authenticateUserUseCase = module.get(AuthenticateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      cpf: '123.456.789-01',
      password: 'testPassword123',
    };

    const mockAuthResponse = {
      access_token: 'mock-jwt-token',
      user: {
        id: 'user-id',
        cpf: '123.456.789-01',
        role: 'deliveryman',
      },
    };

    it('should return auth response when login is successful', async () => {
      authenticateUserUseCase.execute.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authenticateUserUseCase.execute).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException when authentication fails', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      authenticateUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should handle other errors from use case', async () => {
      const error = new Error('Internal server error');
      authenticateUserUseCase.execute.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow('Internal server error');
    });
  });
});