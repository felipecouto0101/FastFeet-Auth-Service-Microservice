import { ApiProperty } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ description: 'User ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: 'CPF', example: '12345678901' })
  cpf: string;

  @ApiProperty({ description: 'Role', example: 'deliveryman' })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({ 
    description: 'JWT token for authentication', 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  access_token: string;

  @ApiProperty({ description: 'Authenticated user data', type: AuthUserDto })
  user: AuthUserDto;
}