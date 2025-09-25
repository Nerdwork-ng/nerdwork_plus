#!/bin/bash

# Replace 'your-github-actions-user' with your actual IAM user name
GITHUB_USER="Praise_DevOps"
POLICY_NAME="GitHubActionsECSDeployment"

echo "Creating IAM policy from github-actions-ecs-policy.json..."

# Create the policy
aws iam create-policy \
  --policy-name $POLICY_NAME \
  --policy-document file://github-actions-ecs-policy.json \
  --description "Policy for GitHub Actions to deploy to ECS"

# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Attach policy to user
echo "Attaching policy to user $GITHUB_USER..."
aws iam attach-user-policy \
  --user-name $GITHUB_USER \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME

echo "✅ Policy applied successfully!"
echo "Policy ARN: arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"