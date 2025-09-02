# 📚 Nerdwork+ API Documentation

**Base URL**: `https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev`

**Region**: Ireland (eu-west-1) 🇮🇪

## 🏗️ Architecture Overview

Nerdwork+ is built as a microservices architecture with 8 core services:

```
Frontend (React/Next.js)
    ↓
API Gateway (AWS Lambda)
    ↓
┌─────────────────────────────────────────────┐
│  Microservices (AWS Lambda Functions)      │
├─────────────────────────────────────────────┤
│ 🔐 Auth Service     │ 👤 User Service      │
│ 💰 Wallet Service   │ 📖 Comic Service     │  
│ 🎫 Event Service    │ 📊 Ledger Service    │
│ 📁 File Service     │ 🌐 API Gateway       │
└─────────────────────────────────────────────┘
    ↓
Database (PostgreSQL)
```

## 🚀 Quick Start

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Content Type
All requests should use JSON:
```
Content-Type: application/json
```

## 📋 Service Documentation

1. [🔐 Auth Service](./auth-service.md) - User authentication
2. [👤 User Service](./user-service.md) - User profiles & creators
3. [💰 Wallet Service](./wallet-service.md) - NWT tokens & payments
4. [📖 Comic Service](./comic-service.md) - Comics & chapters
5. [🎫 Event Service](./event-service.md) - Events & tickets
6. [📊 Ledger Service](./ledger-service.md) - Financial tracking
7. [📁 File Service](./file-service.md) - File uploads & management
8. [🌐 API Gateway](./api-gateway.md) - Route management

## 🔄 User Flows

1. [👤 User Registration & Login Flow](./flows/auth-flow.md)
2. [🎨 Creator Onboarding Flow](./flows/creator-flow.md)
3. [📖 Comic Creation & Publishing Flow](./flows/comic-flow.md)
4. [💰 Token Purchase & Payment Flow](./flows/payment-flow.md)
5. [🎫 Event Creation & Ticketing Flow](./flows/event-flow.md)

## 🧪 Testing

### Postman Collection
Import our Postman collection: [Nerdwork+ API.postman_collection.json](./postman/collection.json)

### Health Checks
```bash
# Test all services
curl https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth/health
curl https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/users/health  
curl https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet/health
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
export AWS_REGION=eu-west-1
export API_BASE_URL=https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev
```

## 📊 Rate Limits & Quotas

- **Rate Limit**: 1000 requests/minute per IP
- **Token Limit**: 10000 requests/day per authenticated user
- **File Upload**: Max 50MB per file
- **Payload Size**: Max 6MB per request

## 🔒 Security

- All sensitive data encrypted at rest
- JWT tokens expire after 24 hours
- HTTPS required for all endpoints
- CORS enabled for web applications

## 📈 Monitoring

- **CloudWatch Logs**: Real-time logging
- **X-Ray Tracing**: Request tracing
- **Health Checks**: Automated monitoring

## 🆘 Support

- **Documentation Issues**: Create an issue in the repository
- **API Issues**: Check CloudWatch logs in Ireland region
- **Status Page**: [AWS Service Health](https://status.aws.amazon.com/)

---

**Last Updated**: ${new Date().toISOString()}
**Version**: 1.0.0
**Environment**: Development