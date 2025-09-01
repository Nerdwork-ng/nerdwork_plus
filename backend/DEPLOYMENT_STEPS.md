# 🚀 Nerdwork+ Deployment Guide - Quick Start

## Prerequisites Setup

### 1. Install AWS CLI (Windows)
Since automated installation failed, please install manually:

**Option A: Download Windows Installer**
1. Go to: https://aws.amazon.com/cli/
2. Download AWS CLI MSI installer for Windows
3. Run the installer and follow prompts
4. Restart your terminal/VS Code

**Option B: Use PowerShell (Run as Administrator)**
```powershell
# In PowerShell as Administrator
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Option C: Alternative - Use AWS SDK only (No CLI needed)**
We can deploy using just the serverless framework + AWS SDK (already installed).

### 2. Configure AWS Credentials

**Option A: Set Environment Variables (Recommended for quick start)**
```bash
# Set these in your terminal before deployment
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here  
export AWS_REGION=eu-west-1
```

**Option B: Create AWS credentials file**
Create file: `~/.aws/credentials`
```ini
[default]
aws_access_key_id = your_access_key_here
aws_secret_access_key = your_secret_key_here
region = eu-west-1
```

### 3. Get AWS Access Keys
1. Go to AWS Console → IAM → Users
2. Create new user with programmatic access
3. Attach policy: `AdministratorAccess` (for initial setup)
4. Save Access Key ID and Secret Access Key

## Quick Deployment (Option 1: Without AWS CLI)

If you want to skip AWS CLI installation and deploy directly:

```bash
# 1. Set environment variables in your terminal
export AWS_ACCESS_KEY_ID=your_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_here
export AWS_REGION=eu-west-1

# 2. Deploy using serverless directly
cd backend
npm run install:all
npm run build:services
serverless deploy --stage dev
```

## Full Deployment (Option 2: With Infrastructure)

```bash
# 1. Configure AWS credentials (see above)

# 2. Run our deployment script
cd backend
node deploy.js dev

# Or step by step:
npm run install:all
npm run build:services  
serverless deploy --stage dev
```

## Environment Variables Setup

After initial deployment, set up Parameter Store values:

### Using AWS Console (Recommended for first time)
1. Go to AWS Console → Systems Manager → Parameter Store
2. Create parameters with these names:

```
/nerdwork/dev/DATABASE_URL
/nerdwork/dev/JWT_SECRET  
/nerdwork/dev/HELIO_API_KEY
/nerdwork/dev/HELIO_RECEIVER_WALLET
/nerdwork/dev/HELIO_CLUSTER
```

### Using PowerShell (if you have AWS CLI)
```powershell
aws ssm put-parameter --name "/nerdwork/dev/JWT_SECRET" --value "your-jwt-secret" --type "SecureString"
aws ssm put-parameter --name "/nerdwork/dev/DATABASE_URL" --value "postgresql://user:pass@host:5432/db" --type "SecureString"
# Add other parameters...
```

## Database Setup Options

### Option 1: Use existing Neon/Supabase database
- Just update the DATABASE_URL parameter with your existing connection string

### Option 2: Create RDS instance
- Use the CloudFormation template in `deployment/aws-infrastructure.yml`
- Or create manually in AWS Console

### Option 3: Keep using your current database
- No changes needed, just update the connection string in Parameter Store

## Testing Deployment

After deployment:
```bash
# Check if functions deployed
serverless info --stage dev

# Test endpoints (replace with your actual API Gateway URL)
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/auth/health
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/users/health
```

## Troubleshooting

### "AWS credentials not found"
- Make sure environment variables are set in the same terminal session
- Or create ~/.aws/credentials file

### "Module not found" errors
- Run `npm run install:all` to install dependencies in all services

### "Permission denied" errors  
- Check IAM permissions - user needs Lambda, API Gateway, CloudFormation access

### "Stack already exists" errors
- Use `serverless remove --stage dev` to remove existing stack
- Or use different stage name like `dev2`

## Next Steps After Deployment

1. **Test all endpoints** - Make sure each service responds
2. **Set up monitoring** - CloudWatch logs and alarms  
3. **Configure custom domain** - Route 53 + API Gateway custom domain
4. **Set up CI/CD** - GitHub Actions for automated deployments
5. **Security hardening** - Restrict IAM permissions, enable WAF

## Cost Estimation

For development/testing:
- Lambda: $0-10/month (generous free tier)
- API Gateway: $0-5/month  
- RDS (if used): $15-25/month for db.t3.micro
- S3: $1-5/month
- **Total: $16-45/month** for development

Ready to deploy? Start with Step 2 above! 🚀