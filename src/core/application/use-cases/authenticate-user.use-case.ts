import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PasswordService } from '../../domain/services/password.service';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { SQSService } from '../../../infrastructure/messaging/sqs.service';
import { DeliverymanMessagingService } from '../../../infrastructure/messaging/deliveryman-messaging.service';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly sqsService: SQSService,
    private readonly deliverymanMessaging: DeliverymanMessagingService,
  ) {}

  async execute(loginDto: LoginDto): Promise<AuthResponseDto> {
    const requestId = uuidv4();
    
    
    await this.deliverymanMessaging.requestDeliverymanData({
      cpf: loginDto.cpf,
      requestId,
    });

    
    const response = await this.deliverymanMessaging.waitForDeliverymanResponse(requestId);
    
    if (!response || response.error || !response.deliveryman) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { deliveryman } = response;
    
    if (!deliveryman.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    
    const isPasswordValid = await this.passwordService.compare(
      loginDto.password,
      deliveryman.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    
    const payload = {
      sub: deliveryman.id,
      cpf: deliveryman.cpf,
      role: 'deliveryman',
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const access_token = jwt.sign(payload, secret, { expiresIn: '24h' });

    
    await this.sqsService.sendAuthEvent({
      eventType: 'USER_AUTHENTICATED',
      userId: deliveryman.id,
      cpf: deliveryman.cpf,
      role: 'deliveryman',
      timestamp: new Date().toISOString(),
    });

    return {
      access_token,
      user: {
        id: deliveryman.id,
        cpf: deliveryman.cpf,
        role: 'deliveryman',
      },
    };
  }
}