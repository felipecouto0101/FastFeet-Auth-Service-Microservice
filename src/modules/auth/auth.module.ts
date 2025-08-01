import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtStrategy } from '../../presentation/strategies/jwt.strategy';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { PasswordService } from '../../core/domain/services/password.service';
import { BcryptPasswordService } from '../../infrastructure/services/bcrypt-password.service';
import { SQSService } from '../../infrastructure/messaging/sqs.service';
import { DeliverymanMessagingService } from '../../infrastructure/messaging/deliveryman-messaging.service';

@Module({
  imports: [PassportModule, ConfigModule],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthenticateUserUseCase,
    SQSService,
    DeliverymanMessagingService,
    {
      provide: PasswordService,
      useClass: BcryptPasswordService,
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
