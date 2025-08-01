import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
    credentials: false,
  });
  
  const config = new DocumentBuilder()
    .setTitle('Auth Service - FastFeet')
    .setDescription('Authentication microservice for the FastFeet system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`🚀 Auth Service is running on port ${port}`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api`);
}
if (require.main === module) {
  bootstrap();
}

export { handler } from './lambda';
