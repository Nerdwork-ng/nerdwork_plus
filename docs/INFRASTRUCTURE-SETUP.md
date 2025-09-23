# 🏗️ Nerdwork+ Infrastructure Setup Guide

## Overview

Your project has **two infrastructure approaches** available:

1. **🚀 CloudFormation (Quick Setup)** - `backend/deployment/aws-infrastructure.yml`
2. **🔧 CDK (Modern/Advanced)** - `infra/` directory

## 📋 What the Infrastructure Provides

### Core Components
- **🌐 VPC** with public/private subnets across 2 AZs
- **⚖️ Application Load Balancer** for traffic distribution
- **🐳 ECS Fargate Cluster** for containerized services
- **🗄️ PostgreSQL RDS Database** (15.4, encrypted)
- **🗂️ S3 Buckets** for file storage and deployments
- **☁️ CloudFront CDN** for content delivery
- **🔐 SSM Parameter Store** for secure secret management

### Security Features
- **🛡️ Security Groups** with least-privilege access
- **🔒 Private subnets** for database and sensitive services
- **🗝️ Encrypted storage** and secrets management
- **🌍 Public subnets** only for load balancer

---

## 🚀 Quick Start (CloudFormation)

### Prerequisites
```bash
# Install required tools
aws configure  # Configure AWS credentials
gh auth login  # Authenticate GitHub CLI
```

### Step 1: Deploy Infrastructure
```bash
# Make scripts executable
chmod +x scripts/deploy-infrastructure.sh
chmod +x scripts/setup-github-secrets.sh

# Deploy to staging
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
./scripts/deploy-infrastructure.sh staging eu-west-1
```

### Step 2: Configure GitHub Secrets
```bash
# Automatically extract and set GitHub secrets
./scripts/setup-github-secrets.sh staging eu-west-1
```

### Step 3: Enable CI/CD Pipeline
Uncomment and activate the pipelines:
```bash
# In .github/workflows/ci.yml - your main pipeline is already configured
# The infrastructure setup provides the resources it needs
```

---

## 🔧 Advanced Setup (CDK)

### Prerequisites
```bash
cd infra
npm install
npm install -g aws-cdk
```

### Step 1: Bootstrap CDK
```bash
cdk bootstrap aws://YOUR-ACCOUNT-ID/eu-west-1
```

### Step 2: Deploy with CDK
```bash
# Deploy staging
cdk deploy --context environment=staging \
  --context databasePassword="$(openssl rand -base64 32)" \
  --context jwtSecret="$(openssl rand -base64 64)"

# Deploy production
cdk deploy --context environment=production \
  --context databasePassword="$(openssl rand -base64 32)" \
  --context jwtSecret="$(openssl rand -base64 64)"
```

### Step 3: Enable Infrastructure Pipeline
```bash
# Uncomment .github/workflows/infrastructure.yml
# This will automatically deploy infrastructure changes via CDK
```

---

## 🎯 Integration with Your CI/CD Pipeline

### Current Pipeline Integration Points

Your `ci.yml` pipeline is **already configured** to work with this infrastructure:

#### 🐳 Docker Build Job
- Pushes to ECR repository
- Uses the deployed VPC and security groups

#### 🎆 Lambda Deployment 
- Deploys backend services to Lambda
- Uses the RDS database connection
- Stores secrets in SSM Parameter Store

#### 🚢 ECS Staging Deployment
- Deploys containerized frontend to ECS
- Uses the ALB, ECS cluster, and subnets
- Connects to the Lambda backend

### Required GitHub Secrets

The setup script automatically configures these:
```bash
AWS_ACCOUNT_ID          # Your AWS account ID
AWS_ACCESS_KEY_ID       # AWS access key  
AWS_SECRET_ACCESS_KEY   # AWS secret key
DATABASE_URL            # PostgreSQL connection string
JWT_SECRET              # JWT signing secret
VPC_ID                  # VPC identifier
ECS_CLUSTER_NAME        # ECS cluster name
ECS_SUBNET_IDS          # Public subnet IDs for ECS tasks
ECS_SECURITY_GROUP_ID   # Security group for ECS tasks
S3_BUCKET_NAME          # S3 bucket for deployments
```

Manual configuration needed:
```bash
GOOGLE_CLIENT_ID        # Google OAuth client ID
GOOGLE_CLIENT_SECRET    # Google OAuth secret
HELIO_API_KEY          # Helio payment API key
HELIO_CLUSTER          # Helio blockchain cluster
CLOUDFRONT_DOMAIN      # CloudFront distribution domain
```

---

## 🔄 Migration Path

### Phase 1: Immediate (CloudFormation)
1. ✅ Deploy infrastructure with CloudFormation
2. ✅ Configure GitHub secrets automatically  
3. ✅ Use existing CI/CD pipeline
4. ✅ Test with staging deployments

### Phase 2: Long-term (CDK)
1. 🔄 Migrate to CDK for better infrastructure as code
2. 🔄 Enable infrastructure pipeline for automated changes
3. 🔄 Add monitoring and observability stack
4. 🔄 Implement multi-environment promotions

---

## 💰 Cost Optimization

### Current Setup Costs (Staging)
- **ECS Fargate**: ~$15-30/month (based on usage)
- **RDS t3.micro**: ~$15/month  
- **ALB**: ~$20/month
- **NAT Gateway**: ~$32/month
- **S3/CloudWatch**: ~$5-10/month
- **Total**: ~$87-117/month

### Production Optimizations
- Use RDS Multi-AZ for high availability
- Enable ECS auto-scaling
- Implement CloudFront for global delivery
- Add monitoring and alerting

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Stack Already Exists
```bash
# Update existing stack
aws cloudformation update-stack \
  --stack-name nerdwork-staging-infrastructure \
  --template-body file://backend/deployment/aws-infrastructure.yml \
  --parameters ParameterKey=Environment,ParameterValue=staging
```

#### 2. GitHub Secrets Not Set
```bash
# Manually set a secret
gh secret set SECRET_NAME --body "secret_value"

# List current secrets
gh secret list
```

#### 3. ECS Tasks Not Starting
```bash
# Check ECS service events
aws ecs describe-services \
  --cluster nerdwork-staging-cluster \
  --services nerdwork-frontend-service

# Check task definition
aws ecs describe-task-definition \
  --task-definition nerdwork-frontend:latest
```

---

## 📊 Monitoring & Observability

### CloudWatch Resources Created
- **Log Groups**: `/ecs/nerdwork-frontend`, `/aws/lambda/nerdwork-backend`
- **Metrics**: ECS service metrics, RDS performance
- **Alarms**: Database connections, ECS service health

### Useful Commands
```bash
# View ECS service logs
aws logs tail /ecs/nerdwork-frontend --follow

# Check database connections
aws rds describe-db-instances \
  --db-instance-identifier nerdwork-staging-db

# Monitor Lambda functions
aws logs tail /aws/lambda/nerdwork-backend-staging --follow
```

---

## 🚀 Next Steps

1. **Deploy Infrastructure**: Choose CloudFormation for quick setup
2. **Configure Secrets**: Run the setup script to configure GitHub
3. **Test Pipeline**: Push to main branch to trigger deployment
4. **Monitor**: Set up CloudWatch dashboards and alerts
5. **Scale**: Add auto-scaling and performance optimization

Your infrastructure is designed to support:
- ✅ **Thousands of concurrent users**
- ✅ **High availability** across multiple AZs  
- ✅ **Secure** encrypted data and network isolation
- ✅ **Scalable** container and database platform
- ✅ **Cost-effective** with managed services

The setup bridges your current serverless (Lambda) backend with a containerized frontend, providing the best of both worlds for your SaaS platform.