import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    description: 'Deliveryman CPF (11 digits)', 
    example: '12345678901',
    minLength: 11,
    maxLength: 11
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF must have 11 digits' })
  cpf: string;

  @ApiProperty({ 
    description: 'Deliveryman password', 
    example: '123456' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}