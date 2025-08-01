import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { LoginDto } from '../../core/application/dtos/login.dto';
import { AuthResponseDto } from '../../core/application/dtos/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate a deliveryman' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.authenticateUserUseCase.execute(loginDto);
  }
}