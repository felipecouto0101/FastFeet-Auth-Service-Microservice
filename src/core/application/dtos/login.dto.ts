import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Deliveryman CPF (format: 123.456.789-00)', 
    example: '123.456.789-00',
    pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
    message: 'CPF must be in format 123.456.789-00' 
  })
  cpf: string;

  @ApiProperty({ 
    description: 'Deliveryman password', 
    example: '123456' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}