export class DeliverymanResponseDto {
  requestId: string;
  deliveryman?: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    password: string; 
    isActive: boolean;
  };
  error?: string;
}