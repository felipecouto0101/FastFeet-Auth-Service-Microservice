# FastFeet - Auth Service Microservice

## Project Description

Authentication microservice for the FastFeet system, responsible for managing deliveryman login, JWT token generation and asynchronous communication with other services via Amazon SQS.

### Features
- ✅ Authentication with CPF and password
- ✅ JWT token generation
- ✅ Asynchronous communication via SQS
- ✅ Clean Architecture
- ✅ Data validation with class-validator
- ✅ Serverless deployment on AWS
- ✅ Automatic documentation with Swagger

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │───▶│  SQS Requests   │───▶│Deliveryman Serv.│
│                 │    │                 │    │                 │
│                 │◀───│ SQS Responses   │◀───│   DynamoDB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## AWS Infrastructure

### Created Resources
- **AWS Lambda**: Serverless application execution
- **API Gateway**: Public HTTP endpoints
- **SQS Queues**: Asynchronous communication between microservices
  - `auth-service-{stage}-auth-events`
  - `auth-service-{stage}-deliveryman-requests`
  - `auth-service-{stage}-deliveryman-responses`
- **CloudFormation**: Infrastructure as code management
- **IAM Roles**: Permissions to access AWS resources

### Security Configuration
- JWT Secret stored in AWS Systems Manager
- AWS credentials automatically managed by Lambda
- CORS configured for web requests

## Setup and Installation

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Active AWS account

### 1. Installation
```bash
git clone <repository-url>
cd auth-service

npm install
```

### 2. Local Configuration
```bash
cp .env.example .env

echo "JWT_SECRET=your-super-secret-jwt-key-here" > .env
```

### 3. AWS Deployment
```bash
aws ssm put-parameter \
  --name "/auth-service/dev/jwt-secret" \
  --value "your-super-secret-jwt-key-here" \
  --type "SecureString"

npm run sls:deploy
```

### 4. Available Commands
```bash
npm run start:dev

npm run build

npm run sls:deploy

npm run sls:remove

npm run sls:logs

npm run test
npm run test:e2e
npm run test:cov
```

## API Endpoints

### Base URL
- **Local**: `http://localhost:3000`
- **AWS**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev`

### Documentation
- **Swagger UI**: `{base-url}/api`

### POST /auth/login
Authenticates a deliveryman with CPF and password.

**Request:**
```json
{
  "cpf": "123.456.789-01",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "cpf": "123.456.789-01",
    "role": "deliveryman"
  }
}
```

**Response (401):**
```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Validations
- **CPF**: Required format `123.456.789-01` (11 digits with formatting)
- **Password**: Required string, not empty

## Microservices Communication

### Authentication Flow
1. **Frontend** → `POST /auth/login` → **Auth Service**
2. **Auth Service** → SQS Request → **Deliveryman Service**
3. **Deliveryman Service** → Database search → SQS Response → **Auth Service**
4. **Auth Service** → Password validation → Generate JWT → **Frontend**
5. **Auth Service** → Send event → **SQS Events**

### SQS Messages

#### Request (Auth → Deliveryman)
```json
{
  "action": "FIND_DELIVERYMAN_BY_CPF",
  "requestId": "uuid-v4",
  "cpf": "123.456.789-01"
}
```

#### Response (Deliveryman → Auth)
```json
{
  "requestId": "uuid-v4",
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Deliveryman Name",
    "email": "email@example.com",
    "cpf": "123.456.789-01",
    "password": "$2b$10$hash...",
    "phone": "(11) 99999-9999",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Authentication Events
```json
{
  "eventType": "USER_AUTHENTICATED",
  "userId": "uuid",
  "cpf": "123.456.789-01",
  "role": "deliveryman",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### SQS Queues
- **auth-service-{stage}-deliveryman-requests**: Data requests
- **auth-service-{stage}-deliveryman-responses**: Data responses
- **auth-service-{stage}-auth-events**: Authentication events

### Timeout and Retry
- **Timeout**: 30 seconds for Deliveryman Service response
- **Retry**: Automatic via SQS (Dead Letter Queue configurable)

## License

This project is licensed under the [MIT License](LICENSE).

---

**Developed for the FastFeet system** 🚀
