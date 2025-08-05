import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DeliverymanMessagingService } from '../src/infrastructure/messaging/deliveryman-messaging.service';
import { SQSService } from '../src/infrastructure/messaging/sqs.service';
import { PasswordService } from '../src/core/domain/services/password.service';

describe('Auth Service (e2e)', () => {
  let app: INestApplication;
  let deliverymanMessagingService: DeliverymanMessagingService;
  let sqsService: SQSService;
  let passwordService: PasswordService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(DeliverymanMessagingService)
    .useValue({
      requestDeliverymanData: jest.fn(),
      waitForDeliverymanResponse: jest.fn(),
    })
    .overrideProvider(SQSService)
    .useValue({
      sendAuthEvent: jest.fn(),
    })
    .overrideProvider(PasswordService)
    .useValue({
      compare: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    
    deliverymanMessagingService = moduleFixture.get<DeliverymanMessagingService>(DeliverymanMessagingService);
    sqsService = moduleFixture.get<SQSService>(SQSService);
    passwordService = moduleFixture.get<PasswordService>(PasswordService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should authenticate user successfully', async () => {
      const mockDeliverymanData = {
        requestId: 'test-id',
        deliveryman: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          cpf: '123.456.789-01',
          password: '$2b$10$hashedPassword',
          phone: '(11) 99999-9999',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      jest.spyOn(deliverymanMessagingService, 'waitForDeliverymanResponse')
        .mockResolvedValue(mockDeliverymanData);
      
      jest.spyOn(deliverymanMessagingService, 'requestDeliverymanData')
        .mockResolvedValue(undefined);
      
      jest.spyOn(sqsService, 'sendAuthEvent')
        .mockResolvedValue(undefined);
      
      jest.spyOn(passwordService, 'compare')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01',
          password: 'senha123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toEqual({
        id: 'user-123',
        cpf: '123.456.789-01',
        role: 'deliveryman'
      });
    });

    it('should return 401 for invalid credentials', async () => {
      jest.spyOn(deliverymanMessagingService, 'waitForDeliverymanResponse')
        .mockResolvedValue(null);
      
      jest.spyOn(deliverymanMessagingService, 'requestDeliverymanData')
        .mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('should return 400 for invalid CPF format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '12345678901',
          password: 'senha123'
        })
        .expect(400);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01'
        })
        .expect(400);
    });

    it('should return 400 for empty password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01',
          password: ''
        })
        .expect(400);
    });

    it('should return 401 for inactive user', async () => {
      const mockInactiveUser = {
        requestId: 'test-id',
        deliveryman: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          cpf: '123.456.789-01',
          password: '$2b$10$hashedPassword',
          phone: '(11) 99999-9999',
          isActive: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      };

      jest.spyOn(deliverymanMessagingService, 'waitForDeliverymanResponse')
        .mockResolvedValue(mockInactiveUser);
      
      jest.spyOn(deliverymanMessagingService, 'requestDeliverymanData')
        .mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01',
          password: 'senha123'
        })
        .expect(401);
    });

    it('should return 401 when deliveryman service returns error', async () => {
      const mockErrorResponse = {
        requestId: 'test-id',
        error: 'Deliveryman not found'
      };

      jest.spyOn(deliverymanMessagingService, 'waitForDeliverymanResponse')
        .mockResolvedValue(mockErrorResponse);
      
      jest.spyOn(deliverymanMessagingService, 'requestDeliverymanData')
        .mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          cpf: '123.456.789-01',
          password: 'senha123'
        })
        .expect(401);
    });
  });
});
