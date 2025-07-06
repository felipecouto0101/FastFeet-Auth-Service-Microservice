import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from '../../presentation/controllers/auth.controller';
import { JwtStrategy } from '../../presentation/strategies/jwt.strategy';
import { AuthenticateUserUseCase } from '../../core/application/use-cases/authenticate-user.use-case';
import { UserRepository } from '../../core/domain/repositories/user.repository';
import { PasswordService } from '../../core/domain/services/password.service';
import { DynamoDBUserRepository } from '../../infrastructure/repositories/dynamodb-user.repository';
import { BcryptPasswordService } from '../../infrastructure/services/bcrypt-password.service';
import { SQSService } from '../../infrastructure/messaging/sqs.service';

@Module({
  imports: [PassportModule],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthenticateUserUseCase,
    SQSService,
    {
      provide: UserRepository,
      useClass: DynamoDBUserRepository,
    },
    {
      provide: PasswordService,
      useClass: BcryptPasswordService,
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
