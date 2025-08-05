import { validate } from 'class-validator';
import { DeliverymanRequestDto } from './deliveryman-request.dto';

describe('DeliverymanRequestDto', () => {
  let dto: DeliverymanRequestDto;

  beforeEach(() => {
    dto = new DeliverymanRequestDto();
  });

  describe('cpf validation', () => {
    it('should pass validation with valid CPF format', async () => {
      dto.cpf = '123.456.789-01';
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(0);
    });

    it('should fail validation with invalid CPF format', async () => {
      dto.cpf = '12345678901';
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(1);
      expect(cpfErrors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation when CPF is empty', async () => {
      dto.cpf = '';
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when CPF is not a string', async () => {
      (dto as any).cpf = 12345678901;
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors.length).toBeGreaterThan(0);
    });
  });

  describe('requestId validation', () => {
    it('should pass validation with valid requestId', async () => {
      dto.cpf = '123.456.789-01';
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);
      const requestIdErrors = errors.filter(error => error.property === 'requestId');

      expect(requestIdErrors).toHaveLength(0);
    });

    it('should fail validation when requestId is empty', async () => {
      dto.cpf = '123.456.789-01';
      dto.requestId = '';

      const errors = await validate(dto);
      const requestIdErrors = errors.filter(error => error.property === 'requestId');

      expect(requestIdErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when requestId is not a string', async () => {
      dto.cpf = '123.456.789-01';
      (dto as any).requestId = 123456;

      const errors = await validate(dto);
      const requestIdErrors = errors.filter(error => error.property === 'requestId');

      expect(requestIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('combined validation', () => {
    it('should pass validation with all valid fields', async () => {
      dto.cpf = '123.456.789-01';
      dto.requestId = 'valid-request-id';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation with all invalid fields', async () => {
      dto.cpf = 'invalid-cpf';
      dto.requestId = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'cpf')).toBe(true);
      expect(errors.some(error => error.property === 'requestId')).toBe(true);
    });
  });
});