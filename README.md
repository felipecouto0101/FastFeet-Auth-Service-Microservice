# Auth Service - FastFeet

Authentication microservice for the FastFeet system, responsible for managing login, JWT and communication with other services via SQS.

## Features

- ✅ Login with CPF and password
- ✅ JWT token generation
- ✅ DynamoDB integration
- ✅ SQS communication
- ✅ Clean Architecture
- ✅ Data validation

## Project Structure

```
src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   ├── repositories/
│   │   └── services/
│   └── application/
│       ├── dtos/
│       └── use-cases/
├── infrastructure/
│   ├── repositories/
│   ├── services/
│   └── messaging/
├── modules/
├── presentation/
│   ├── controllers/
│   ├── guards/
│   └── strategies/
```

## Configuration

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Configure the environment variables:
```env
JWT_SECRET=your-super-secret-jwt-key-here
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DYNAMODB_TABLE_NAME=DeliveryMen
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/auth-events
DELIVERYMAN_REQUEST_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/deliveryman-requests
DELIVERYMAN_RESPONSE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/deliveryman-responses
```

## Installation

```bash
npm install
```

## Running

```bash

npm run start:dev


npm run start:prod
```

## API Endpoints

### POST /auth/login
Authenticates a user with CPF and password.

**Request:**
```json
{
  "cpf": "12345678901",
  "password": "senha123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "cpf": "12345678901",
    "name": "User Name",
    "email": "user@email.com",
    "role": "deliveryman"
  }
}
```

## Authentication Process

1. **Login**: User sends CPF and password to Auth Service
2. **Request**: Auth Service sends SQS message to Deliveryman Service
3. **Search**: Deliveryman Service searches for deliveryman by CPF in DynamoDB
4. **Response**: Deliveryman Service returns data + password hash via SQS
5. **Validation**: Auth Service compares password with hash (bcrypt.compare)
6. **Token**: Auth Service generates JWT if password is valid
7. **Event**: Sends authentication event via SQS
8. **Response**: Returns token and user data

## Microservices Communication

### SQS Queues

- **deliveryman-requests**: Auth Service → Deliveryman Service
- **deliveryman-responses**: Deliveryman Service → Auth Service
- **auth-events**: Authentication events

### SQS Messages

**Data request (Auth → Deliveryman):**
```json
{
  "cpf": "12345678901",
  "requestId": "uuid-v4"
}
```

**Data response (Deliveryman → Auth):**
```json
{
  "requestId": "uuid-v4",
  "deliveryman": {
    "id": "string",
    "cpf": "string",
    "name": "string",
    "email": "string",
    "password": "string",  
    "isActive": "boolean"
  }
}
```

## SQS Events

The service sends events to SQS when:

- User logs in (`USER_AUTHENTICATED`)
- User is created (`USER_CREATED`)
- User is updated (`USER_UPDATED`)

**Event format:**
```json
{
  "eventType": "USER_AUTHENTICATED",
  "userId": "user-id",
  "cpf": "12345678901",
  "role": "deliveryman",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Tests

```bash

npm run test


npm run test:e2e


npm run test:cov
```