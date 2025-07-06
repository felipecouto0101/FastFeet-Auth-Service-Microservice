import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordService } from '../../core/domain/services/password.service';

@Injectable()
export class BcryptPasswordService implements PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}