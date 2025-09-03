#!/bin/bash

# Setup AWS Systems Manager Parameters for Nerdwork+ Frontend
# Run this script to store environment variables securely in AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up AWS Systems Manager Parameters for Nerdwork+ Frontend${NC}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}Error: AWS CLI not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

# Set default region
REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${ENVIRONMENT:-production}

echo -e "${YELLOW}Region: $REGION${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"

# Function to create parameter
create_parameter() {
    local name=$1
    local value=$2
    local type=${3:-String}
    
    echo "Creating parameter: $name"
    
    aws ssm put-parameter \
        --region $REGION \
        --name "/nerdwork/frontend/$ENVIRONMENT/$name" \
        --value "$value" \
        --type "$type" \
        --overwrite \
        --description "Nerdwork+ Frontend - $name" \
        --tags Key=Environment,Value=$ENVIRONMENT Key=Service,Value=nerdwork-frontend
}

echo -e "${YELLOW}Creating frontend environment parameters...${NC}"

# API Configuration
create_parameter "api-url" "https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev"
create_parameter "node-env" "production"

# Solana Configuration
create_parameter "solana-network" "mainnet-beta"
create_parameter "solana-rpc-url" "https://api.mainnet-beta.solana.com"
create_parameter "helio-cluster" "mainnet"

# App Configuration
create_parameter "app-name" "Nerdwork+"
create_parameter "app-url" "https://app.nerdwork.com"

# Optional parameters (uncomment when ready)
# create_parameter "google-client-id" "your_google_client_id_here" "SecureString"
# create_parameter "ga-id" "G-XXXXXXXXXX"

echo -e "${GREEN}✅ All parameters created successfully!${NC}"

echo -e "${YELLOW}To verify parameters were created:${NC}"
echo "aws ssm get-parameters-by-path --path \"/nerdwork/frontend/$ENVIRONMENT\" --recursive --region $REGION"

echo -e "${YELLOW}To update task definition with new parameter ARNs:${NC}"
echo "Update the 'secrets' section in your task definition with:"
echo "  - arn:aws:ssm:$REGION:\$(aws sts get-caller-identity --query Account --output text):parameter/nerdwork/frontend/$ENVIRONMENT/api-url"