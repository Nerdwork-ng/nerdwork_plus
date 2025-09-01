# 🚀 Nerdwork+ AWS Deployment Guide

Complete guide for deploying the Nerdwork+ microservices architecture to AWS using Lambda, RDS, API Gateway, and other AWS services.

## 📋 Architecture Overview

### Production Architecture
```
Frontend (Vercel/CloudFront)
    ↓
AWS API Gateway (Custom Domain)
    ↓
Lambda Functions (7 Microservices)
    ↓
RDS PostgreSQL (Multi-AZ)
    ↓
S3 (File Storage) + CloudFront (CDN)
```

### Microservices Deployment Strategy
- **7 Lambda Functions**: One for each microservice
- **API Gateway**: Route requests to appropriate Lambda
- **RDS PostgreSQL**: Shared database across services
- **S3 + CloudFront**: Static file storage and CDN
- **Parameter Store**: Environment variables management
- **CloudWatch**: Logging and monitoring

---

## 🏗️ Phase 1: AWS Account Setup

### 1.1 AWS Account Preparation
```bash
# Install AWS CLI
npm install -g aws-cli

# Configure AWS credentials
aws configure
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]  
# Default region name: us-east-1
# Default output format: json
```

### 1.2 Required AWS Services
- ✅ **Lambda** (Compute)
- ✅ **API Gateway** (HTTP Routing)
- ✅ **RDS** (PostgreSQL Database)
- ✅ **S3** (File Storage)
- ✅ **CloudFront** (CDN)
- ✅ **Systems Manager** (Parameter Store)
- ✅ **CloudWatch** (Logging)
- ✅ **IAM** (Permissions)

---

## 🗃️ Phase 2: Database Setup (RDS PostgreSQL)

### 2.1 Create RDS PostgreSQL Instance

**AWS Console Steps:**
1. Go to **RDS Console** → **Create database**
2. **Engine options:**
   - Engine type: `PostgreSQL`
   - Version: `15.4` (latest)
3. **Templates:** `Production` (for prod) or `Free tier` (for testing)
4. **Settings:**
   - DB instance identifier: `nerdwork-postgres-prod`
   - Master username: `nerdwork_admin`
   - Master password: `[Generate secure password]`
5. **DB instance class:**
   - Burstable classes: `db.t3.micro` (free tier) or `db.t3.small` (production)
6. **Storage:**
   - Storage type: `General Purpose SSD (gp2)`
   - Allocated storage: `20 GB` (minimum)
   - Storage autoscaling: `Enable` (max 100GB)
7. **Connectivity:**
   - VPC: `Default VPC`
   - Public access: `No`
   - VPC security groups: `Create new` → `nerdwork-db-sg`
8. **Database authentication:**
   - Database authentication: `Password authentication`
9. **Additional configuration:**
   - Initial database name: `nerdwork_prod`
   - Backup retention: `7 days`
   - Monitoring: `Enable Performance Insights`

### 2.2 Database Security Group Configuration
```bash
# Create security group for database
aws ec2 create-security-group \
    --group-name nerdwork-db-sg \
    --description "Nerdwork database security group"

# Allow Lambda access (will need Lambda security group ID)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxxx \
    --protocol tcp \
    --port 5432 \
    --source-group sg-yyyyyyyyy
```

### 2.3 Get Database Connection String
After RDS creation, note the endpoint:
```
nerdwork-postgres-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432
```

---

## 📁 Phase 3: S3 Storage Setup

### 3.1 Create S3 Buckets

**Primary Storage Bucket:**
```bash
# Create main assets bucket
aws s3 mb s3://nerdwork-assets-prod --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket nerdwork-assets-prod \
    --versioning-configuration Status=Enabled

# Set CORS policy
aws s3api put-bucket-cors \
    --bucket nerdwork-assets-prod \
    --cors-configuration file://s3-cors-policy.json
```

**S3 CORS Policy** (`s3-cors-policy.json`):
```json
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://nerdwork.com", "https://*.nerdwork.com"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

### 3.2 CloudFront CDN Setup

**AWS Console Steps:**
1. Go to **CloudFront** → **Create Distribution**
2. **Origin Settings:**
   - Origin domain: `nerdwork-assets-prod.s3.us-east-1.amazonaws.com`
   - Origin access: `Origin access control settings`
   - Create OAC: `nerdwork-assets-oac`
3. **Default Cache Behavior:**
   - Viewer protocol policy: `Redirect HTTP to HTTPS`
   - Allowed HTTP methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
   - Cache key and origin requests: `CORS-S3Origin`
4. **Settings:**
   - Price class: `Use all edge locations`
   - Custom SSL certificate: `[Setup later with ACM]`

---

## ⚙️ Phase 4: Parameter Store Configuration

### 4.1 Store Environment Variables
```bash
# Database URL
aws ssm put-parameter \
    --name "/nerdwork/prod/DATABASE_URL" \
    --value "postgresql://nerdwork_admin:password@nerdwork-postgres-prod.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/nerdwork_prod" \
    --type "SecureString"

# JWT Secret
aws ssm put-parameter \
    --name "/nerdwork/prod/JWT_SECRET" \
    --value "your-super-secure-jwt-secret-for-production" \
    --type "SecureString"

# Helio API Keys
aws ssm put-parameter \
    --name "/nerdwork/prod/HELIO_API_KEY" \
    --value "your_helio_production_api_key" \
    --type "SecureString"

aws ssm put-parameter \
    --name "/nerdwork/prod/HELIO_RECEIVER_WALLET" \
    --value "your_production_solana_wallet_address" \
    --type "String"

# Pinata IPFS Keys
aws ssm put-parameter \
    --name "/nerdwork/prod/PINATA_API_KEY" \
    --value "your_pinata_api_key" \
    --type "SecureString"

aws ssm put-parameter \
    --name "/nerdwork/prod/PINATA_SECRET_API_KEY" \
    --value "your_pinata_secret_api_key" \
    --type "SecureString"

# S3 Configuration
aws ssm put-parameter \
    --name "/nerdwork/prod/S3_BUCKET_NAME" \
    --value "nerdwork-assets-prod" \
    --type "String"

aws ssm put-parameter \
    --name "/nerdwork/prod/S3_REGION" \
    --value "us-east-1" \
    --type "String"
```

---

## 🔧 Phase 5: Lambda Functions Deployment

### 5.1 Install Serverless Framework
```bash
npm install -g serverless
serverless plugin install -n serverless-plugin-typescript
serverless plugin install -n serverless-offline
```

### 5.2 Create Serverless Configuration

**Root `serverless.yml`:**
```yaml
service: nerdwork-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  environment:
    STAGE: ${self:provider.stage}
    
  # IAM permissions
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - ssm:GetParameter
            - ssm:GetParameters
          Resource: 
            - "arn:aws:ssm:us-east-1:*:parameter/nerdwork/${self:provider.stage}/*"
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: 
            - "arn:aws:s3:::nerdwork-assets-${self:provider.stage}/*"
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: "*"

# VPC Configuration for RDS access
  vpc:
    securityGroupIds:
      - sg-xxxxxxxxx # Lambda security group
    subnetIds:
      - subnet-xxxxxxxxx
      - subnet-yyyyyyyyy

functions:
  # API Gateway Proxy
  api-gateway:
    handler: api-gateway/src/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: api-gateway

  # Auth Service
  auth-service:
    handler: services/auth-service/src/lambda.handler
    events:
      - http:
          path: /auth/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: auth-service

  # User Service  
  user-service:
    handler: services/user-service/src/lambda.handler
    events:
      - http:
          path: /users/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: user-service

  # Comic Service
  comic-service:
    handler: services/comic-service/src/lambda.handler
    events:
      - http:
          path: /comics/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: comic-service

  # Wallet Service
  wallet-service:
    handler: services/wallet-service/src/lambda.handler
    events:
      - http:
          path: /wallet/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: wallet-service

  # Event Service
  event-service:
    handler: services/event-service/src/lambda.handler
    events:
      - http:
          path: /events/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: event-service

  # Ledger Service
  ledger-service:
    handler: services/ledger-service/src/lambda.handler
    events:
      - http:
          path: /ledger/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: ledger-service

  # File Service
  file-service:
    handler: services/file-service/src/lambda.handler
    events:
      - http:
          path: /files/{proxy+}
          method: ANY
          cors: true
    environment:
      SERVICE_TYPE: file-service

plugins:
  - serverless-plugin-typescript
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3000
```

### 5.3 Lambda Handler Template

Create `lambda.ts` for each service:
```typescript
// services/auth-service/src/lambda.ts
import serverless from 'serverless-http';
import { app } from './index';

// Load environment variables from Parameter Store
const loadParameters = async () => {
  const AWS = require('aws-sdk');
  const ssm = new AWS.SSM({ region: 'us-east-1' });
  
  const parameterNames = [
    '/nerdwork/prod/DATABASE_URL',
    '/nerdwork/prod/JWT_SECRET',
    '/nerdwork/prod/STRIPE_SECRET_KEY',
    // Add other parameters as needed
  ];
  
  const { Parameters } = await ssm.getParameters({
    Names: parameterNames,
    WithDecryption: true
  }).promise();
  
  Parameters.forEach(param => {
    const envName = param.Name.split('/').pop();
    process.env[envName] = param.Value;
  });
};

// Initialize parameters on cold start
let parametersLoaded = false;

export const handler = async (event, context) => {
  if (!parametersLoaded) {
    await loadParameters();
    parametersLoaded = true;
  }
  
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};
```

---

## 🌐 Phase 6: API Gateway Configuration

### 6.1 Custom Domain Setup

**AWS Console Steps:**
1. **Certificate Manager (ACM):**
   - Request certificate for `api.nerdwork.com`
   - Validate domain ownership (DNS validation)

2. **API Gateway → Custom Domain Names:**
   - Domain name: `api.nerdwork.com`
   - Certificate: `Select ACM certificate`
   - Security policy: `TLS 1.2`
   - Endpoint type: `Regional`

3. **Create Base Path Mapping:**
   - Path: `/v1`
   - Destination: `nerdwork-backend-prod`
   - Stage: `prod`

### 6.2 Route 53 DNS Configuration
```bash
# Create A record for API subdomain
aws route53 change-resource-record-sets \
    --hosted-zone-id Z1234567890ABC \
    --change-batch file://api-dns-record.json
```

**DNS Record** (`api-dns-record.json`):
```json
{
    "Changes": [{
        "Action": "CREATE",
        "ResourceRecordSet": {
            "Name": "api.nerdwork.com",
            "Type": "A",
            "AliasTarget": {
                "DNSName": "d-xxxxxxxxx.execute-api.us-east-1.amazonaws.com",
                "EvaluateTargetHealth": false,
                "HostedZoneId": "Z1UJRXOUMOOFQ8"
            }
        }
    }]
}
```

---

## 🚀 Phase 7: Deployment Process

### 7.1 Environment-Specific Deployment

**Development/Staging:**
```bash
# Deploy to staging
serverless deploy --stage staging

# Deploy specific service
serverless deploy function --function auth-service --stage staging
```

**Production:**
```bash
# Deploy to production
serverless deploy --stage production

# Verify deployment
serverless info --stage production
```

### 7.2 Database Migration
```bash
# Run database migrations on production
NODE_ENV=production npm run migrate:prod

# Seed initial data if needed
NODE_ENV=production npm run seed:prod
```

### 7.3 Post-Deployment Verification
```bash
# Test API endpoints
curl -X GET https://api.nerdwork.com/v1/health
curl -X GET https://api.nerdwork.com/v1/auth/health
curl -X GET https://api.nerdwork.com/v1/users/health

# Run production tests
npm run test:production
```

---

## 📊 Phase 8: Monitoring & Logging

### 8.1 CloudWatch Configuration

**Log Groups:**
- `/aws/lambda/nerdwork-backend-prod-auth-service`
- `/aws/lambda/nerdwork-backend-prod-user-service`
- `/aws/lambda/nerdwork-backend-prod-comic-service`
- `/aws/lambda/nerdwork-backend-prod-wallet-service`
- `/aws/lambda/nerdwork-backend-prod-event-service`
- `/aws/lambda/nerdwork-backend-prod-ledger-service`
- `/aws/lambda/nerdwork-backend-prod-file-service`

### 8.2 Alarms Setup
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "Nerdwork-High-Error-Rate" \
    --alarm-description "High error rate in Lambda functions" \
    --metric-name "Errors" \
    --namespace "AWS/Lambda" \
    --statistic "Sum" \
    --period 300 \
    --threshold 10 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2

# High latency alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "Nerdwork-High-Latency" \
    --alarm-description "High latency in API Gateway" \
    --metric-name "Latency" \
    --namespace "AWS/ApiGateway" \
    --statistic "Average" \
    --period 300 \
    --threshold 5000 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2
```

---

## 🔒 Phase 9: Security & Best Practices

### 9.1 IAM Roles & Policies

**Lambda Execution Role:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:CreateNetworkInterface",
                "ec2:DescribeNetworkInterfaces",
                "ec2:DeleteNetworkInterface"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters"
            ],
            "Resource": "arn:aws:ssm:us-east-1:*:parameter/nerdwork/prod/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::nerdwork-assets-prod/*"
        }
    ]
}
```

### 9.2 VPC Security Groups

**Lambda Security Group:**
```bash
# Allow HTTPS outbound (for external APIs)
aws ec2 authorize-security-group-egress \
    --group-id sg-lambda-xxxxxxxxx \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Allow HTTP outbound (for internal services)
aws ec2 authorize-security-group-egress \
    --group-id sg-lambda-xxxxxxxxx \
    --protocol tcp \
    --port 80 \
    --cidr 10.0.0.0/8

# Allow database access
aws ec2 authorize-security-group-egress \
    --group-id sg-lambda-xxxxxxxxx \
    --protocol tcp \
    --port 5432 \
    --source-group sg-database-xxxxxxxxx
```

---

## 💰 Phase 10: Cost Optimization

### 10.1 Lambda Optimization
- **Memory allocation:** Start with 512MB, monitor and adjust
- **Timeout:** Set appropriate timeouts (30s max for API Gateway)
- **Provisioned concurrency:** Only for high-traffic functions
- **Dead letter queues:** For error handling

### 10.2 RDS Optimization
- **Instance sizing:** Start with `db.t3.micro`, scale based on usage
- **Storage autoscaling:** Enable with reasonable max limits
- **Backup retention:** 7 days for production, 1 day for staging
- **Multi-AZ:** Only for production

### 10.3 S3 & CloudFront Optimization
- **S3 storage classes:** Use IA or Glacier for old files
- **CloudFront caching:** Set appropriate TTLs
- **Compression:** Enable gzip compression

---

## 📋 Phase 11: CI/CD Pipeline

### 11.1 GitHub Actions Workflow

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Deploy to staging
        if: github.ref == 'refs/heads/develop'
        run: serverless deploy --stage staging
      
      - name: Deploy to production
        if: github.ref == 'refs/heads/main'
        run: serverless deploy --stage production
      
      - name: Run production tests
        if: github.ref == 'refs/heads/main'
        run: npm run test:production
```

---

## 📚 Phase 12: Documentation & Maintenance

### 12.1 API Documentation
- **Swagger/OpenAPI:** Auto-generate from code
- **Postman collections:** Export and version control
- **Integration guides:** For frontend teams

### 12.2 Monitoring Dashboard
- **CloudWatch Dashboard:** Key metrics visualization
- **Error tracking:** Sentry or CloudWatch Insights
- **Performance monitoring:** X-Ray tracing

### 12.3 Backup Strategy
- **Database:** Automated RDS backups + manual snapshots
- **S3:** Cross-region replication for critical assets
- **Code:** Git repositories with proper branching

---

## 🚨 Troubleshooting Guide

### Common Issues:

**Lambda Cold Starts:**
```typescript
// Keep connections warm
let dbConnection;
export const handler = async (event, context) => {
  if (!dbConnection) {
    dbConnection = await createDatabaseConnection();
  }
  // ... rest of handler
};
```

**RDS Connection Issues:**
- Check security groups and VPC configuration
- Verify Lambda is in correct subnets
- Test database connectivity from Lambda

**S3 Upload Failures:**
- Check IAM permissions
- Verify CORS configuration
- Monitor CloudWatch logs

### Health Checks:
```bash
# API Gateway health check
curl https://api.nerdwork.com/v1/health

# Individual service health checks
curl https://api.nerdwork.com/v1/auth/health
curl https://api.nerdwork.com/v1/users/health
curl https://api.nerdwork.com/v1/comics/health
```

---

## 📊 Estimated Costs (Monthly)

### MVP Traffic (1K-10K users):
- **Lambda:** $10-50
- **RDS (db.t3.small):** $25-40
- **S3 Storage:** $5-20
- **CloudFront:** $5-15
- **API Gateway:** $3-10
- **Parameter Store:** $1-3
- **Total:** $49-143/month

### Scale (10K-100K users):
- **Lambda:** $50-200
- **RDS (db.t3.medium):** $60-100
- **S3 Storage:** $20-100
- **CloudFront:** $15-50
- **API Gateway:** $10-40
- **Total:** $155-490/month

---

## ✅ Deployment Checklist

### Pre-Deployment:
- [ ] AWS account configured
- [ ] RDS PostgreSQL instance created
- [ ] S3 buckets created with proper CORS
- [ ] Parameter Store values configured
- [ ] Domain certificates issued (ACM)
- [ ] Security groups configured

### Deployment:
- [ ] Serverless framework configured
- [ ] All Lambda functions deployed
- [ ] API Gateway custom domain configured
- [ ] Database migrations run
- [ ] Health checks passing

### Post-Deployment:
- [ ] CloudWatch alarms configured
- [ ] Production tests passing
- [ ] Monitoring dashboard setup
- [ ] CI/CD pipeline configured
- [ ] Documentation updated
- [ ] Team access permissions set

---

**🎉 Your Nerdwork+ MVP is now ready for production on AWS!**

For support and questions, refer to the AWS documentation or create issues in the project repository.