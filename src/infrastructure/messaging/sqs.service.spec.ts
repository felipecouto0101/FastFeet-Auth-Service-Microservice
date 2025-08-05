import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SQSService } from './sqs.service';


jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendMessageCommand: jest.fn(),
}));

describe('SQSService', () => {
  let service: SQSService;
  let configService: ConfigService;
  let mockSend: jest.Mock;

  beforeEach(async () => {
    mockSend = jest.fn();
    
    const { SQSClient } = require('@aws-sdk/client-sqs');
    SQSClient.mockImplementation(() => ({
      send: mockSend,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SQSService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'SQS_QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/auth-events',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SQSService>(SQSService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct queue URL', () => {
      expect(configService.get).toHaveBeenCalledWith('SQS_QUEUE_URL');
    });
  });

  describe('sendAuthEvent', () => {
    const mockEvent = {
      eventType: 'USER_AUTHENTICATED' as const,
      userId: 'user-id',
      cpf: '123.456.789-01',
      role: 'deliveryman',
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    it('should send auth event successfully', async () => {
      const mockResult = { MessageId: 'test-message-id' };
      mockSend.mockResolvedValue(mockResult);

      await service.sendAuthEvent(mockEvent);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when SQS send fails', async () => {
      const error = new Error('SQS Error');
      mockSend.mockRejectedValue(error);

      await expect(service.sendAuthEvent(mockEvent)).rejects.toThrow('SQS Error');
    });

    it('should handle different event types', async () => {
      const mockResult = { MessageId: 'test-message-id' };
      mockSend.mockResolvedValue(mockResult);

      const userCreatedEvent = {
        eventType: 'USER_CREATED' as const,
        userId: 'user-id',
        cpf: '123.456.789-01',
        role: 'deliveryman',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      await service.sendAuthEvent(userCreatedEvent);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle empty queue URL', async () => {
      const { SQSClient } = require('@aws-sdk/client-sqs');
      SQSClient.mockImplementation(() => ({
        send: mockSend,
      }));

      const module = await Test.createTestingModule({
        providers: [
          SQSService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => ''), 
            },
          },
        ],
      }).compile();

      const serviceWithEmptyUrl = module.get<SQSService>(SQSService);
      const mockResult = { MessageId: 'test-message-id' };
      mockSend.mockResolvedValue(mockResult);

      await serviceWithEmptyUrl.sendAuthEvent(mockEvent);

      expect(mockSend).toHaveBeenCalled();
    });
  });
});