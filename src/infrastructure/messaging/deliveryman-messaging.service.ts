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
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
    this.requestQueueUrl = this.configService.get<string>('DELIVERYMAN_REQUEST_QUEUE_URL') || '';
    this.responseQueueUrl = this.configService.get<string>('DELIVERYMAN_RESPONSE_QUEUE_URL') || '';
  }

  async requestDeliverymanData(request: DeliverymanRequestDto): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.requestQueueUrl,
      MessageBody: JSON.stringify(request),
      MessageAttributes: {
        messageType: {
          DataType: 'String',
          StringValue: 'DELIVERYMAN_REQUEST',
        },
      },
    });

    await this.sqsClient.send(command);
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
          const response: DeliverymanResponseDto = JSON.parse(message.Body || '{}');
          
          if (response.requestId === requestId) {
            
            await this.sqsClient.send(new DeleteMessageCommand({
              QueueUrl: this.responseQueueUrl,
              ReceiptHandle: message.ReceiptHandle,
            }));
            
            return response;
          }
        }
      }
      
     
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }
}