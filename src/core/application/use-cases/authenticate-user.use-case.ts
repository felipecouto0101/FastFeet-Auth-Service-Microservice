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
    console.log('Login attempt for CPF:', loginDto.cpf);
    const requestId = uuidv4();
    
    console.log('Sending request to deliveryman service with requestId:', requestId);
    await this.deliverymanMessaging.requestDeliverymanData({
      cpf: loginDto.cpf,
      requestId,
    });

    console.log('Waiting for deliveryman response...');
    const response = await this.deliverymanMessaging.waitForDeliverymanResponse(requestId, 30000); 
    
    console.log('Deliveryman response received:', JSON.stringify(response, null, 2));
    
    if (!response || response.error || !response.deliveryman) {
      console.log('No valid response from deliveryman service');
      throw new UnauthorizedException('Invalid credentials');
    }

    const { deliveryman } = response;
    
    if (!deliveryman.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!deliveryman.password) {
      console.log('Password field missing from deliveryman data');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Comparing password with hash');
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