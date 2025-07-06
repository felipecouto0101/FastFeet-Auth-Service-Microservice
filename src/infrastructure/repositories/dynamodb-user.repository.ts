/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { UserRepository } from '../../core/domain/repositories/user.repository';
import { User } from '../../core/domain/entities/user.entity';

@Injectable()
export class DynamoDBUserRepository implements UserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName = 'DeliveryMen';

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'cpf = :cpf',
      ExpressionAttributeValues: {
        ':cpf': cpf,
      },
    });

    const result = await this.docClient.send(command);

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return User.fromDeliveryMan(item);
  }

  async findById(id: string): Promise<User | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });

    const result = await this.docClient.send(command);

    if (!result.Item) {
      return null;
    }

    const item = result.Item;
    return User.fromDeliveryMan(item);
  }

  async save(user: User): Promise<void> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        id: user.id,
        cpf: user.cpf,
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });

    await this.docClient.send(command);
  }

  async update(user: User): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id: user.id },
      UpdateExpression:
        'SET #name = :name, email = :email, password = :password, isActive = :isActive, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': user.name,
        ':email': user.email,
        ':password': user.password,
        ':isActive': user.isActive,
        ':updatedAt': new Date().toISOString(),
      },
    });

    await this.docClient.send(command);
  }

  async delete(id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    });

    await this.docClient.send(command);
  }
}
