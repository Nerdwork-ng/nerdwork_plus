#!/bin/bash

# Nerdwork+ Frontend Deployment Script for AWS ECS Fargate
# This script builds, pushes, and deploys your Next.js app to ECS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}
SERVICE_NAME="nerdwork-frontend-service"
CLUSTER_NAME="$ENVIRONMENT-nerdwork-cluster"
REPOSITORY_NAME="nerdwork-frontend"

echo -e "${BLUE}🚀 Starting Nerdwork+ Frontend Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    exit 1
fi

if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured${NC}"
    exit 1
fi

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPOSITORY_NAME"

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo -e "${YELLOW}Account ID: $ACCOUNT_ID${NC}"
echo -e "${YELLOW}ECR URI: $ECR_URI${NC}"

# Step 1: Login to ECR
echo -e "${BLUE}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 2: Create ECR repository if it doesn't exist
echo -e "${BLUE}📦 Checking ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $REPOSITORY_NAME --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository --repository-name $REPOSITORY_NAME --region $REGION
    echo -e "${GREEN}✅ ECR repository created${NC}"
else
    echo -e "${GREEN}✅ ECR repository exists${NC}"
fi

# Step 3: Build Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE_TAG="$ENVIRONMENT-$COMMIT_SHA"

docker build -t $REPOSITORY_NAME:$IMAGE_TAG .
docker tag $REPOSITORY_NAME:$IMAGE_TAG $ECR_URI:$IMAGE_TAG
docker tag $REPOSITORY_NAME:$IMAGE_TAG $ECR_URI:latest

echo -e "${GREEN}✅ Docker image built successfully${NC}"

# Step 4: Push to ECR
echo -e "${BLUE}📤 Pushing image to ECR...${NC}"
docker push $ECR_URI:$IMAGE_TAG
docker push $ECR_URI:latest

echo -e "${GREEN}✅ Image pushed successfully${NC}"

# Step 5: Update ECS service
echo -e "${BLUE}🚢 Updating ECS service...${NC}"

# Check if service exists
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}Forcing new deployment...${NC}"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}✅ Service update initiated${NC}"
    
    # Wait for deployment to complete
    echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION
    
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ ECS service not found. Please create the service first using CloudFormation.${NC}"
    exit 1
fi

# Step 6: Get service status
echo -e "${BLUE}📊 Getting service status...${NC}"
SERVICE_INFO=$(aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION)
RUNNING_COUNT=$(echo $SERVICE_INFO | jq -r '.services[0].runningCount')
DESIRED_COUNT=$(echo $SERVICE_INFO | jq -r '.services[0].desiredCount')

echo -e "${GREEN}Service Status:${NC}"
echo -e "  Running tasks: $RUNNING_COUNT"
echo -e "  Desired tasks: $DESIRED_COUNT"

# Step 7: Get load balancer URL
echo -e "${BLUE}🌐 Getting application URL...${NC}"
LB_DNS=$(aws elbv2 describe-load-balancers \
    --names "$ENVIRONMENT-nerdwork-alb" \
    --region $REGION \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "Load balancer not found")

if [ "$LB_DNS" != "Load balancer not found" ] && [ "$LB_DNS" != "None" ]; then
    echo -e "${GREEN}✅ Application URL: https://$LB_DNS${NC}"
else
    echo -e "${YELLOW}⚠️  Load balancer DNS not found${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Monitor the deployment: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
echo -e "  2. Check application logs: aws logs tail /ecs/nerdwork-frontend --follow"
echo -e "  3. Verify health: curl https://$LB_DNS/api/health"