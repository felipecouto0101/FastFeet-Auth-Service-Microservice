import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AppModule } from './app.module';
import express from 'express';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    
    const app = await NestFactory.create(AppModule, adapter);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
      credentials: false,
    });
    
    await app.init();
    cachedServer = expressApp;
  }
  
  return cachedServer;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const server = await bootstrap();
  
  return new Promise((resolve, reject) => {
    const callback = (error: any, response: APIGatewayProxyResult) => {
      if (error) {
        reject(error);
      } else {
        
        response.headers = {
          ...response.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Accept,Authorization,X-Requested-With',
        };
        resolve(response);
      }
    };

    const serverlessExpress = require('@vendia/serverless-express');
    serverlessExpress({ app: server })(event, context, callback);
  });
};