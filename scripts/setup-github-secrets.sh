#!/bin/bash

# GitHub Secrets Setup Script
# Extracts values from deployed AWS infrastructure and sets GitHub repository secrets

set -e

ENVIRONMENT=${1:-staging}
REGION=${2:-eu-west-1}
REPO_OWNER=${3:-$(gh repo view --json owner -q .owner.login)}
REPO_NAME=${4:-$(gh repo view --json name -q .name)}

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
    echo "❌ Could not determine repository owner/name. Please provide them as arguments."
    echo "Usage: $0 [environment] [region] [repo-owner] [repo-name]"
    exit 1
fi

echo "🔐 Setting up GitHub Secrets for $REPO_OWNER/$REPO_NAME"
echo "📋 Environment: $ENVIRONMENT, Region: $REGION"

# Check if GitHub CLI is authenticated
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated. Run: gh auth login"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured or not authenticated"
    exit 1
fi

STACK_NAME="InfraStack"

# Function to set GitHub secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ] || [ "$secret_value" = "null" ]; then
        echo "⚠️  Skipping $secret_name (empty value)"
        return
    fi
    
    echo "Setting $secret_name..."
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_OWNER/$REPO_NAME"
    echo "✅ $secret_name set successfully"
}

echo "📊 Retrieving infrastructure information..."

# Get stack outputs
VPC_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
    --output text 2>/dev/null || echo "")

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text 2>/dev/null || echo "")

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text 2>/dev/null || echo "")

ECS_CLUSTER=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
    --output text 2>/dev/null || echo "")

# Get secrets from SSM Parameter Store
DATABASE_URL=$(aws ssm get-parameter \
    --name "/nerdwork/$ENVIRONMENT/database-url" \
    --with-decryption \
    --region $REGION \
    --query 'Parameter.Value' \
    --output text 2>/dev/null || echo "")

JWT_SECRET=$(aws ssm get-parameter \
    --name "/nerdwork/$ENVIRONMENT/jwt-secret" \
    --with-decryption \
    --region $REGION \
    --query 'Parameter.Value' \
    --output text 2>/dev/null || echo "")

# Get subnets (for ECS deployment)
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*public*" \
    --region $REGION \
    --query 'Subnets[].SubnetId' \
    --output text | tr '\t' ',' 2>/dev/null || echo "")

PRIVATE_SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*private*" \
    --region $REGION \
    --query 'Subnets[].SubnetId' \
    --output text | tr '\t' ',' 2>/dev/null || echo "")

# Get security groups
ECS_SECURITY_GROUP=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*ECS*" \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "")

ALB_SECURITY_GROUP=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*ALB*" \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "")

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔧 Setting GitHub Secrets..."

# Core AWS Configuration
set_secret "AWS_ACCOUNT_ID" "$AWS_ACCOUNT_ID"
set_secret "AWS_REGION" "$REGION"

# Database
set_secret "DATABASE_URL" "$DATABASE_URL"
set_secret "JWT_SECRET" "$JWT_SECRET"
set_secret "JWT_EXPIRES_IN" "7d"

# Infrastructure IDs
set_secret "VPC_ID" "$VPC_ID"
set_secret "ECS_CLUSTER_NAME" "$ECS_CLUSTER"
set_secret "ECS_SUBNET_IDS" "$SUBNET_IDS"
set_secret "ECS_PRIVATE_SUBNET_IDS" "$PRIVATE_SUBNET_IDS"
set_secret "ECS_SECURITY_GROUP_ID" "$ECS_SECURITY_GROUP"
set_secret "ALB_SECURITY_GROUP_ID" "$ALB_SECURITY_GROUP"
set_secret "ALB_DNS_NAME" "$ALB_DNS"

# S3 Configuration (you'll need to create this)
S3_BUCKET_NAME="nerdwork-${ENVIRONMENT}-files-${AWS_ACCOUNT_ID}"
set_secret "S3_BUCKET_NAME" "$S3_BUCKET_NAME"

# Placeholder secrets (you'll need to configure these)
echo "⚠️  Please configure these secrets manually:"
echo "- GOOGLE_CLIENT_ID (for Google OAuth)"
echo "- GOOGLE_CLIENT_SECRET (for Google OAuth)"
echo "- HELIO_API_KEY (for Helio payments)"
echo "- HELIO_CLUSTER (for Helio payments)"
echo "- HELIO_BASE_URL_DEV (for Helio payments)"
echo "- CLOUDFRONT_DOMAIN (after setting up CloudFront)"
echo "- CLOUDFRONT_DISTRIBUTION_ID (after setting up CloudFront)"
echo "- MAX_FILES_PER_UPLOAD (default: 20)"
echo "- MAX_FILE_SIZE (default: 104857600)"

echo ""
echo "✅ GitHub Secrets configuration completed!"
echo ""
echo "📋 Summary of configured infrastructure:"
echo "- VPC: $VPC_ID"
echo "- ECS Cluster: $ECS_CLUSTER"
echo "- Database Endpoint: $DB_ENDPOINT"
echo "- Load Balancer: $ALB_DNS"
echo "- Public Subnets: $SUBNET_IDS"
echo "- Private Subnets: $PRIVATE_SUBNET_IDS"
echo ""
echo "🚀 Your CI/CD pipeline should now be able to deploy to this infrastructure!"