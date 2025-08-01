import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class DeliverymanRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
  cpf: string;
  
  @IsString()
  @IsNotEmpty()
  requestId: string;
}