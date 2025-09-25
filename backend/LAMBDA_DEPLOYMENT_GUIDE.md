# Lambda Microservices Deployment Guide

## Architecture Overview

This backend is now configured as a microservices architecture with separate Lambda functions for each service:

### Services Structure:
- **Auth Service** → `/auth/*` endpoints
- **User Service** → `/profile/*` and `/users/*` endpoints  
- **Comic Service** → `/comics/*`, `/chapters/*`, `/library/*` endpoints
- **File Service** → `/file-upload/*` endpoints
- **Wallet Service** → `/wallet/*`, `/transactions/*` endpoints
- **Ledger Service** → `/nft/*`, `/payment/*` endpoints
- **Event Service** → `/events/*`, `/tickets/*` endpoints

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js 18.x** installed
3. **Serverless Framework** installed globally: `npm install -g serverless`
4. **Environment variables** configured in AWS Systems Manager Parameter Store or `.env` file

## Installation

```bash
cd backend
npm install
```

## Deployment Options

### 1. Deploy All Services (Recommended for initial deployment)
```bash
npm run deploy:dev
```

### 2. Deploy Individual Services
```bash
# Deploy specific services
npm run deploy:auth     # Auth service only
npm run deploy:user     # User service only
npm run deploy:comic    # Comic service only
npm run deploy:file     # File service only
npm run deploy:wallet   # Wallet service only
npm run deploy:ledger   # Ledger service only
npm run deploy:event    # Event service only
```

### 3. Production Deployment
```bash
npm run deploy:prod
```

## Local Testing

### Test All Services Locally
```bash
npm run offline
```

### Test Individual Services
```bash
npm run test:auth
npm run test:user
npm run test:comic
npm run test:file
npm run test:wallet
npm run test:ledger
npm run test:event
```

## API Endpoints

After deployment, each service will be accessible via:

```
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/auth/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/profile/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/comics/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/file-upload/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/wallet/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/nft/*
https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/events/*
```

## Environment Variables Required

Ensure these environment variables are configured:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
S3_BUCKET_NAME=your-bucket-name
AWS_REGION=eu-west-1
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
HELIO_API_KEY=your-helio-api-key
# ... other environment variables
```

## Monitoring & Logging

Each service logs independently to CloudWatch with the service name prefix:
- `/aws/lambda/nerdwork-backend-dev-auth-service`
- `/aws/lambda/nerdwork-backend-dev-user-service`
- etc.

## Benefits of This Architecture

✅ **Independent Scaling** - Each service scales based on its own traffic
✅ **Isolated Failures** - One service failure doesn't affect others  
✅ **Independent Deployments** - Deploy services individually
✅ **Better Cost Optimization** - Pay only for what you use
✅ **Easier Debugging** - Service-specific logs and metrics

## Troubleshooting

### Common Issues:

1. **Service Not Found**: Ensure the service is deployed
2. **CORS Issues**: Check CORS configuration in serverless.yml
3. **Environment Variables**: Verify all required env vars are set
4. **Database Connection**: Check DATABASE_URL and VPC configuration

### Debugging Commands:
```bash
# Check service logs
serverless logs -f auth-service --tail
serverless logs -f user-service --tail

# Invoke service locally with test data
serverless invoke local -f auth-service --data '{"path": "/auth/me", "httpMethod": "GET"}'
```

## Migration from Monolith

The original monolith API handler is still available at `/{proxy+}` for backward compatibility during migration.