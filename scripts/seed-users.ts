import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

async function seedDeliveryMen() {
  const deliveryMen = [
    {
      id: uuidv4(),
      cpf: '12345678901',
      name: 'João Silva',
      email: 'joao@fastfeet.com',
      password: await bcrypt.hash('123456', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      cpf: '98765432100',
      name: 'Maria Santos',
      email: 'maria@fastfeet.com',
      password: await bcrypt.hash('123456', 10),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const deliveryMan of deliveryMen) {
    const command = new PutCommand({
      TableName: 'DeliveryMen',
      Item: deliveryMan,
    });

    try {
      await docClient.send(command);
      console.log(`Entregador criado: ${deliveryMan.name} (${deliveryMan.cpf})`);
    } catch (error) {
      console.error(`Erro ao criar entregador ${deliveryMan.name}:`, error);
    }
  }
}

seedDeliveryMen()
  .then(() => {
    console.log('Seed concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  });