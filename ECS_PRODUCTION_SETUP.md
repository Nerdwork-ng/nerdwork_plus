# ECS Production Setup Guide

This guide helps you set up the required AWS ECS infrastructure for production deployment.

## Required AWS Resources

### 1. ECS Cluster
The workflow will automatically create the `prod-cluster` if it doesn't exist.

### 2. VPC and Networking (Required)
You need to create these manually and add them to GitHub Secrets:

#### VPC Setup:
1. Go to AWS VPC Console
2. Create a new VPC or use existing one
3. Ensure you have public subnets in at least 2 AZs
4. Create a security group that allows:
   - Inbound: HTTP (80) and HTTPS (443) from anywhere (0.0.0.0/0)
   - Inbound: Custom TCP (3000) from anywhere for Next.js app
   - Outbound: All traffic

#### Required GitHub Secrets:
Add these to your repository secrets:

```bash
ECS_SUBNET_IDS=subnet-xxxxxxxx,subnet-yyyyyyyy    # Public subnet IDs (comma-separated)
ECS_SECURITY_GROUP_ID=sg-xxxxxxxxx                 # Security group ID
```

### 3. IAM Roles
Create these IAM roles:

#### ECS Task Execution Role (`ecsTaskExecutionRole`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach policies:
- `AmazonECSTaskExecutionRolePolicy`
- `CloudWatchLogsFullAccess`

#### ECS Task Role (`ecsTaskRole`):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Common Issues and Solutions

### "Max attempts exceeded" Error
This usually means:

1. **Container failing to start**: Check CloudWatch logs at `/ecs/nerdwork-frontend`
2. **Health check failing**: Ensure your app responds on port 3000
3. **Network issues**: Verify security group and subnet configuration
4. **Resource limits**: Check if CPU/memory limits are sufficient

### Debugging Steps:

1. **Check ECS Events**:
   ```bash
   aws ecs describe-services --cluster prod-cluster --services nerdwork-frontend --region eu-west-1
   ```

2. **Check Task Logs**:
   ```bash
   aws logs get-log-events --log-group-name "/ecs/nerdwork-frontend" --log-stream-name "ecs/nerdwork-frontend/[TASK-ID]" --region eu-west-1
   ```

3. **Verify Docker Image**:
   ```bash
   docker run -p 3000:3000 540384223059.dkr.ecr.eu-west-1.amazonaws.com/nerdwork-frontend:latest
   ```

## Quick Setup Script

Run this AWS CLI script to set up basic infrastructure:

```bash
#!/bin/bash
# Set your values
VPC_ID="vpc-xxxxxxxx"           # Your VPC ID
REGION="eu-west-1"

# Create Security Group
SG_ID=$(aws ec2 create-security-group \
  --group-name nerdwork-frontend-sg \
  --description "Security group for Nerdwork Frontend ECS" \
  --vpc-id $VPC_ID \
  --region $REGION \
  --query 'GroupId' --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region $REGION

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $REGION

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region $REGION

echo "Security Group ID: $SG_ID"
echo "Add this to GitHub Secrets as ECS_SECURITY_GROUP_ID"

# Get subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=map-public-ip-on-launch,Values=true" \
  --region $REGION \
  --query 'Subnets[].SubnetId' --output text | tr '\t' ',')

echo "Subnet IDs: $SUBNET_IDS"
echo "Add this to GitHub Secrets as ECS_SUBNET_IDS"
```

## Monitoring

After deployment, monitor your service:

1. **ECS Console**: Check service status and task health
2. **CloudWatch Logs**: Monitor application logs
3. **CloudWatch Metrics**: Track CPU, memory, and network usage

## Load Balancer (Optional)

For production, consider adding an Application Load Balancer:

1. Create ALB in your VPC
2. Create target group pointing to port 3000
3. Update ECS service to use load balancer
4. Update security groups to allow ALB traffic only