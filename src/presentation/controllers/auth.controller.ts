import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { LoginDto } from '../../core/application/dtos/login.dto';
import { AuthResponseDto } from '../../core/application/dtos/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
  ) {}

  @Post('login')
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authenticateUserUseCase.execute(loginDto);
  }
}