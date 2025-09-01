#!/bin/bash

# Deploy each service individually to avoid packaging issues
echo "🚀 Deploying Nerdwork+ services individually to Ireland..."

# Set Ireland region
export AWS_REGION=eu-west-1

# Check if credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS credentials not set!"
    echo "Please run:"
    echo "export AWS_ACCESS_KEY_ID=your_key_here"
    echo "export AWS_SECRET_ACCESS_KEY=your_secret_here"
    echo "export AWS_REGION=eu-west-1"
    exit 1
fi

echo "✅ AWS Region: $AWS_REGION"
echo "✅ AWS Credentials configured"

# Build all services first
echo "🔨 Building all services..."
npm run build:services

# Deploy each service individually
services=("auth-service" "user-service" "comic-service" "wallet-service" "event-service" "ledger-service" "file-service")

for service in "${services[@]}"; do
    echo ""
    echo "📦 Deploying $service..."
    cd "services/$service"
    
    if [ -f "serverless.yml" ]; then
        serverless deploy --stage dev --region eu-west-1
        if [ $? -eq 0 ]; then
            echo "✅ $service deployed successfully"
        else
            echo "❌ $service deployment failed"
        fi
    else
        echo "⚠️  No serverless.yml found for $service"
    fi
    
    cd "../.."
done

# Deploy API Gateway
echo ""
echo "📦 Deploying API Gateway..."
cd "api-gateway"
if [ -f "serverless.yml" ]; then
    serverless deploy --stage dev --region eu-west-1
    if [ $? -eq 0 ]; then
        echo "✅ API Gateway deployed successfully"
    else
        echo "❌ API Gateway deployment failed"
    fi
else
    echo "⚠️  No serverless.yml found for API Gateway"
fi

cd ".."

echo ""
echo "🎉 All services deployment completed!"
echo "🔍 Check AWS Lambda console in Ireland region for deployed functions"