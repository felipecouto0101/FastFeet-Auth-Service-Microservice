import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { DeliverymanRequestDto } from '../../core/application/dtos/deliveryman-request.dto';
import { DeliverymanResponseDto } from '../../core/application/dtos/deliveryman-response.dto';

@Injectable()
export class DeliverymanMessagingService {
  private readonly sqsClient: SQSClient;
  private readonly requestQueueUrl: string;
  private readonly responseQueueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: 'us-east-1',
    });
    this.requestQueueUrl = this.configService.get<string>('DELIVERYMAN_REQUEST_QUEUE_URL') || '';
    this.responseQueueUrl = this.configService.get<string>('DELIVERYMAN_RESPONSE_QUEUE_URL') || '';
    
    console.log('Request Queue URL:', this.requestQueueUrl);
    console.log('Response Queue URL:', this.responseQueueUrl);
  }

  async requestDeliverymanData(request: DeliverymanRequestDto): Promise<void> {
    console.log('Sending message to queue:', this.requestQueueUrl);
    
    const message = {
      action: 'FIND_DELIVERYMAN_BY_CPF',
      requestId: request.requestId,
      cpf: request.cpf
    };
    
    console.log('Message body:', JSON.stringify(message));
    
    const command = new SendMessageCommand({
      QueueUrl: this.requestQueueUrl,
      MessageBody: JSON.stringify(message),
    });

    const result = await this.sqsClient.send(command);
    console.log('Message sent successfully:', result.MessageId);
  }

  async waitForDeliverymanResponse(requestId: string, timeoutMs: number = 10000): Promise<DeliverymanResponseDto | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.responseQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 1,
        MessageAttributeNames: ['All'],
      });

      const result = await this.sqsClient.send(command);
      
      if (result.Messages) {
        for (const message of result.Messages) {
          const response = JSON.parse(message.Body || '{}');
          console.log('Received response:', response);
          
          if (response.requestId === requestId) {
            await this.sqsClient.send(new DeleteMessageCommand({
              QueueUrl: this.responseQueueUrl,
              ReceiptHandle: message.ReceiptHandle,
            }));
            
           
            if (response.success && response.data) {
              return {
                requestId: response.requestId,
                deliveryman: response.data
              };
            } else {
              return {
                requestId: response.requestId,
                error: 'Deliveryman not found'
              };
            }
          }
        }
      }
      
     
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }
}