#!/bin/bash

# Nerdwork+ CDK Bootstrap Script
# Deploys your CDK infrastructure stack initially

set -e

ENVIRONMENT=${1:-staging}
REGION=${2:-eu-west-1}

echo "🏗️ Bootstrapping Nerdwork+ CDK Infrastructure to $ENVIRONMENT"

# Validate AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Run 'aws configure'"
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Using AWS Account: $AWS_ACCOUNT_ID"

# Generate secure passwords
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo "📋 Infrastructure Parameters:"
echo "- Environment: $ENVIRONMENT"
echo "- Region: $REGION"
echo "- CDK Stack: InfraStack"

cd infra

echo "📦 Installing CDK dependencies..."
npm ci

echo "🔧 Building CDK app..."
npm run build

echo "🚀 Bootstrapping CDK (if not already done)..."
npx cdk bootstrap "aws://$AWS_ACCOUNT_ID/$REGION" || echo "CDK already bootstrapped"

echo "🏗️ Deploying CDK stack..."
npx cdk deploy \
    --context environment="$ENVIRONMENT" \
    --context databasePassword="$DB_PASSWORD" \
    --context jwtSecret="$JWT_SECRET" \
    --require-approval never \
    --verbose

echo "✅ CDK Infrastructure deployment completed!"

# Get stack outputs using CDK
echo "📊 Getting CDK stack outputs..."
STACK_NAME="InfraStack"

# Export important values for GitHub Secrets
echo "🔐 Extracting values for GitHub Secrets..."

# Get outputs from CloudFormation (CDK creates CloudFormation stacks)
VPC_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
    --output text 2>/dev/null || echo "")

echo "VPC_ID: $VPC_ID"

echo ""
echo "🔄 Next Steps:"
echo "1. Run setup-github-secrets.sh to configure GitHub repository secrets"
echo "2. Enable your infrastructure.yml GitHub Actions pipeline"
echo "3. Your ci.yml pipeline should now work with this infrastructure"
echo ""
echo "🚀 CDK Bootstrap completed! Your infrastructure is ready."
