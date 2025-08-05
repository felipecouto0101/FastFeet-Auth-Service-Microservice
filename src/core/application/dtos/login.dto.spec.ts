import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  let dto: LoginDto;

  beforeEach(() => {
    dto = new LoginDto();
  });

  describe('cpf validation', () => {
    it('should pass validation with valid CPF format', async () => {
      dto.cpf = '123.456.789-01';
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(0);
    });

    it('should fail validation with invalid CPF format (no dots)', async () => {
      dto.cpf = '12345678901';
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(1);
      expect(cpfErrors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation with invalid CPF format (no dash)', async () => {
      dto.cpf = '123.456.78901';
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(1);
      expect(cpfErrors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation with invalid CPF format (wrong length)', async () => {
      dto.cpf = '123.456.789-1';
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors).toHaveLength(1);
      expect(cpfErrors[0].constraints).toHaveProperty('matches');
    });

    it('should fail validation when CPF is empty', async () => {
      dto.cpf = '';
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when CPF is not a string', async () => {
      (dto as any).cpf = 12345678901;
      dto.password = 'validPassword';

      const errors = await validate(dto);
      const cpfErrors = errors.filter(error => error.property === 'cpf');

      expect(cpfErrors.length).toBeGreaterThan(0);
    });
  });

  describe('password validation', () => {
    it('should pass validation with valid password', async () => {
      dto.cpf = '123.456.789-01';
      dto.password = 'validPassword123';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should fail validation when password is empty', async () => {
      dto.cpf = '123.456.789-01';
      dto.password = '';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when password is not a string', async () => {
      dto.cpf = '123.456.789-01';
      (dto as any).password = 123456;

      const errors = await validate(dto);
      const passwordErrors = errors.filter(error => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
    });
  });

  describe('combined validation', () => {
    it('should pass validation with all valid fields', async () => {
      dto.cpf = '123.456.789-01';
      dto.password = 'validPassword123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail validation with all invalid fields', async () => {
      dto.cpf = 'invalid-cpf';
      dto.password = '';

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'cpf')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(true);
    });
  });
});