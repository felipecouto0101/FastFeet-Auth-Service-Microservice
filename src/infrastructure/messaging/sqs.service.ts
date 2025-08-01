import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export interface AuthEvent {
  eventType: 'USER_AUTHENTICATED' | 'USER_CREATED' | 'USER_UPDATED';
  userId: string;
  cpf: string;
  role: string;
  timestamp: string;
}

@Injectable()
export class SQSService {
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
        sessionToken: this.configService.get<string>('AWS_SESSION_TOKEN'),
      },
    });
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL') || '';
  }

  async sendAuthEvent(event: AuthEvent): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(event),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event.eventType,
        },
      },
    });

    await this.sqsClient.send(command);
  }
}