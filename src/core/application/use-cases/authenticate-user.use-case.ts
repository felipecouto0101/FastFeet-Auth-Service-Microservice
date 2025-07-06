import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordService } from '../../domain/services/password.service';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { SQSService } from '../../../infrastructure/messaging/sqs.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly sqsService: SQSService,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByCpf(loginDto.cpf);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      cpf: user.cpf,
      role: user.role,
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const access_token = jwt.sign(payload, secret, { expiresIn: '24h' });

    // Enviar evento de autenticação para SQS
    await this.sqsService.sendAuthEvent({
      eventType: 'USER_AUTHENTICATED',
      userId: user.id,
      cpf: user.cpf,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    return {
      access_token,
      user: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}