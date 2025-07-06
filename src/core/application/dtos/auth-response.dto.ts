import { UserRole } from '../../domain/entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    role: UserRole;
  };
}