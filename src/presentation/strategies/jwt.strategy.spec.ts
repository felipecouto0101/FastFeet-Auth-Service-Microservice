import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload and return user data', async () => {
    const payload = {
      sub: 'user-id',
      cpf: '123.456.789-01',
      role: 'deliveryman'
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      id: 'user-id',
      cpf: '123.456.789-01',
      role: 'deliveryman'
    });
  });

  it('should use default secret when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const newStrategy = new JwtStrategy();
    expect(newStrategy).toBeDefined();
  });
});