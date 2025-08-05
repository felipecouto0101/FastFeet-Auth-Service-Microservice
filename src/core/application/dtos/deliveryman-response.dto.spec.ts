import { DeliverymanResponseDto } from './deliveryman-response.dto';

describe('DeliverymanResponseDto', () => {
  describe('constructor and properties', () => {
    it('should create instance with requestId only', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';

      expect(dto.requestId).toBe('test-request-id');
      expect(dto.deliveryman).toBeUndefined();
      expect(dto.error).toBeUndefined();
    });

    it('should create instance with deliveryman data', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';
      dto.deliveryman = {
        id: 'user-id',
        cpf: '123.456.789-01',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      };

      expect(dto.requestId).toBe('test-request-id');
      expect(dto.deliveryman).toBeDefined();
      expect(dto.deliveryman?.id).toBe('user-id');
      expect(dto.deliveryman?.cpf).toBe('123.456.789-01');
      expect(dto.deliveryman?.name).toBe('Test User');
      expect(dto.deliveryman?.email).toBe('test@example.com');
      expect(dto.deliveryman?.password).toBe('hashed-password');
      expect(dto.deliveryman?.isActive).toBe(true);
      expect(dto.error).toBeUndefined();
    });

    it('should create instance with error', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';
      dto.error = 'Deliveryman not found';

      expect(dto.requestId).toBe('test-request-id');
      expect(dto.error).toBe('Deliveryman not found');
      expect(dto.deliveryman).toBeUndefined();
    });

    it('should create instance with both deliveryman and error', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';
      dto.deliveryman = {
        id: 'user-id',
        cpf: '123.456.789-01',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      };
      dto.error = 'Some error';

      expect(dto.requestId).toBe('test-request-id');
      expect(dto.deliveryman).toBeDefined();
      expect(dto.error).toBe('Some error');
    });

    it('should handle partial deliveryman data', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';
      dto.deliveryman = {
        id: 'user-id',
        cpf: '123.456.789-01',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: false,
      };

      expect(dto.deliveryman?.isActive).toBe(false);
    });

    it('should allow undefined deliveryman properties', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'test-request-id';

      expect(dto.deliveryman?.id).toBeUndefined();
      expect(dto.deliveryman?.cpf).toBeUndefined();
      expect(dto.deliveryman?.name).toBeUndefined();
      expect(dto.deliveryman?.email).toBeUndefined();
      expect(dto.deliveryman?.password).toBeUndefined();
      expect(dto.deliveryman?.isActive).toBeUndefined();
    });
  });

  describe('type checking', () => {
    it('should accept string values for string properties', () => {
      const dto = new DeliverymanResponseDto();
      dto.requestId = 'string-value';
      dto.error = 'error-string';

      expect(typeof dto.requestId).toBe('string');
      expect(typeof dto.error).toBe('string');
    });

    it('should accept boolean values for isActive', () => {
      const dto = new DeliverymanResponseDto();
      dto.deliveryman = {
        id: 'user-id',
        cpf: '123.456.789-01',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      };

      expect(typeof dto.deliveryman.isActive).toBe('boolean');
    });
  });
});