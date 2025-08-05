import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DeliverymanMessagingService } from './deliveryman-messaging.service';


jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  SendMessageCommand: jest.fn(),
  ReceiveMessageCommand: jest.fn(),
  DeleteMessageCommand: jest.fn(),
}));

describe('DeliverymanMessagingService', () => {
  let service: DeliverymanMessagingService;
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
        DeliverymanMessagingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'DELIVERYMAN_REQUEST_QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/request-queue',
                'DELIVERYMAN_RESPONSE_QUEUE_URL': 'https://sqs.us-east-1.amazonaws.com/123/response-queue',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DeliverymanMessagingService>(DeliverymanMessagingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct queue URLs', () => {
      expect(configService.get).toHaveBeenCalledWith('DELIVERYMAN_REQUEST_QUEUE_URL');
      expect(configService.get).toHaveBeenCalledWith('DELIVERYMAN_RESPONSE_QUEUE_URL');
    });
  });

  describe('requestDeliverymanData', () => {
    it('should send message to SQS queue successfully', async () => {
      const mockResult = { MessageId: 'test-message-id' };
      mockSend.mockResolvedValue(mockResult);

      const request = {
        cpf: '123.456.789-01',
        requestId: 'test-request-id',
      };

      await service.requestDeliverymanData(request);

      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw error when SQS send fails', async () => {
      const error = new Error('SQS Error');
      mockSend.mockRejectedValue(error);

      const request = {
        cpf: '123.456.789-01',
        requestId: 'test-request-id',
      };

      await expect(service.requestDeliverymanData(request)).rejects.toThrow('SQS Error');
    });
  });

  describe('waitForDeliverymanResponse', () => {
    it('should return deliveryman data when successful response received', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: JSON.stringify({
              requestId: 'test-request-id',
              success: true,
              data: {
                id: 'user-id',
                name: 'Test User',
                cpf: '123.456.789-01',
                password: 'hashed-password',
                isActive: true,
              },
            }),
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({});

      const result = await service.waitForDeliverymanResponse('test-request-id', 1000);

      expect(result).toEqual({
        requestId: 'test-request-id',
        deliveryman: {
          id: 'user-id',
          name: 'Test User',
          cpf: '123.456.789-01',
          password: 'hashed-password',
          isActive: true,
        },
      });
    });

    it('should return error when unsuccessful response received', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: JSON.stringify({
              requestId: 'test-request-id',
              success: false,
            }),
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({});

      const result = await service.waitForDeliverymanResponse('test-request-id', 1000);

      expect(result).toEqual({
        requestId: 'test-request-id',
        error: 'Deliveryman not found',
      });
    });

    it('should return null when timeout is reached', async () => {
      mockSend.mockResolvedValue({ Messages: [] });

      const result = await service.waitForDeliverymanResponse('test-request-id', 100);

      expect(result).toBeNull();
    });

    it('should handle invalid JSON in message body', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: 'invalid-json',
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      await expect(
        service.waitForDeliverymanResponse('test-request-id', 100)
      ).rejects.toThrow();
    });

    it('should handle message with empty body', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: '',
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await service.waitForDeliverymanResponse('test-request-id', 100);
      expect(result).toBeNull();
    });

    it('should handle message with undefined body', async () => {
      const mockResponse = {
        Messages: [
          {
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await service.waitForDeliverymanResponse('test-request-id', 100);
      expect(result).toBeNull();
    });

    it('should handle response without success field', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: JSON.stringify({
              requestId: 'test-request-id',
              data: {
                id: 'user-id',
                name: 'Test User',
              },
            }),
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({});

      const result = await service.waitForDeliverymanResponse('test-request-id', 1000);

      expect(result).toEqual({
        requestId: 'test-request-id',
        error: 'Deliveryman not found',
      });
    });

    it('should handle response with success false and no data', async () => {
      const mockResponse = {
        Messages: [
          {
            Body: JSON.stringify({
              requestId: 'test-request-id',
              success: false,
              data: null,
            }),
            ReceiptHandle: 'test-receipt-handle',
          },
        ],
      };

      mockSend
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce({});

      const result = await service.waitForDeliverymanResponse('test-request-id', 1000);

      expect(result).toEqual({
        requestId: 'test-request-id',
        error: 'Deliveryman not found',
      });
    });

    it('should use default timeout when not provided', async () => {
      mockSend.mockResolvedValue({ Messages: [] });

      const result = await service.waitForDeliverymanResponse('test-request-id', 100);

      expect(result).toBeNull();
    });
  });
});