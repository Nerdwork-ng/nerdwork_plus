#!/bin/bash
# Set environment variables for Ireland region deployment

echo "🇮🇪 Setting up environment for Ireland (eu-west-1) deployment..."

# Set AWS region to Ireland
export AWS_REGION=eu-west-1

# Display current settings
echo "✅ Region set to: $AWS_REGION"

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "⚠️  AWS_ACCESS_KEY_ID not set"
    echo "Please set your credentials:"
    echo "export AWS_ACCESS_KEY_ID=your_access_key_here"
    echo "export AWS_SECRET_ACCESS_KEY=your_secret_key_here"
else
    echo "✅ AWS credentials are configured"
fi

echo ""
echo "🚀 Ready to deploy to Ireland region!"
echo "Run: serverless deploy --stage dev"