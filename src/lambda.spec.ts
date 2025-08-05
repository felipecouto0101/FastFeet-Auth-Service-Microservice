import { handler } from './lambda';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';


jest.mock('@vendia/serverless-express', () => {
  return jest.fn(() => (event: any, context: any, callback: any) => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
      headers: {}
    });
  });
});


jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      enableCors: jest.fn(),
      init: jest.fn()
    })
  }
}));

describe('Lambda Handler', () => {
  const mockEvent = {
    httpMethod: 'GET',
    path: '/test',
    headers: {},
    body: null
  } as APIGatewayProxyEvent;

  const mockContext = {} as Context;

  it('should handle lambda request successfully', async () => {
    const result = await handler(mockEvent, mockContext);
    
    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
  });
});