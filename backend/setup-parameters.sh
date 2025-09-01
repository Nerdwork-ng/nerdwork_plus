#!/bin/bash

echo "🔧 Setting up Parameter Store values for Nerdwork+ in Ireland..."

# Set region for Parameter Store
export AWS_REGION=eu-west-1
STAGE=dev

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS credentials not set!"
    echo "Please set your credentials first"
    exit 1
fi

echo "✅ Setting parameters in eu-west-1 region for stage: $STAGE"

# You'll need to replace these with your actual values:

echo "📝 Setting JWT Secret..."
aws ssm put-parameter \
    --name "/nerdwork/$STAGE/jwt-secret" \
    --value "your-super-secure-jwt-secret-here-replace-with-random-string" \
    --type "SecureString" \
    --overwrite \
    --region eu-west-1

echo "📝 Setting Database URL..."
# Replace with your actual database connection string
# Examples:
# - Neon: postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb
# - Local: postgresql://user:password@localhost:5432/nerdwork
# - RDS: postgresql://user:password@your-rds-endpoint:5432/nerdworkdb

aws ssm put-parameter \
    --name "/nerdwork/$STAGE/database-url" \
    --value "postgresql://user:password@your-database-host:5432/your-database" \
    --type "SecureString" \
    --overwrite \
    --region eu-west-1

echo "📝 Setting Helio API Key..."
aws ssm put-parameter \
    --name "/nerdwork/$STAGE/helio-api-key" \
    --value "your-helio-api-key-here" \
    --type "SecureString" \
    --overwrite \
    --region eu-west-1

echo "📝 Setting Helio Cluster..."
aws ssm put-parameter \
    --name "/nerdwork/$STAGE/helio-cluster" \
    --value "devnet" \
    --type "String" \
    --overwrite \
    --region eu-west-1

echo "📝 Setting Helio Receiver Wallet..."
aws ssm put-parameter \
    --name "/nerdwork/$STAGE/helio-receiver-wallet" \
    --value "your-solana-wallet-address-here" \
    --type "String" \
    --overwrite \
    --region eu-west-1

echo "📝 Setting Payment Success URL..."
aws ssm put-parameter \
    --name "/nerdwork/$STAGE/payment-success-url" \
    --value "https://your-frontend-domain.com/payment/success" \
    --type "String" \
    --overwrite \
    --region eu-west-1

echo ""
echo "✅ Parameter Store setup completed!"
echo ""
echo "🔍 Verify parameters with:"
echo "aws ssm get-parameters-by-path --path '/nerdwork/$STAGE' --region eu-west-1"
echo ""
echo "📝 IMPORTANT: Edit this script and replace placeholder values with your actual:"
echo "- Database connection string"  
echo "- JWT secret (generate a random 32+ character string)"
echo "- Helio API key (from your Helio dashboard)"
echo "- Solana wallet address (for receiving payments)"
echo "- Frontend domain (for payment redirects)"