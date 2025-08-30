AWS Console Deployment - Start Here

  Since you're in the AWS Console, let's deploy step by step. I'll guide you through
  the exact console steps:

  Step 1: Create RDS Database (FIRST)

  1. Go to RDS Console → Click "Create database"
  2. Choose database creation method: Standard create
  3. Engine options: PostgreSQL (latest version)
  4. Templates: Free tier (for testing) or Production
  5. Settings:
    - DB instance identifier: nerdwork-postgres
    - Master username: nerdwork_admin
    - Auto generate password: ✅ (save this!)
  6. DB instance class: db.t3.micro (free tier)
  7. Storage: 20 GB, enable autoscaling
  8. Connectivity:
    - Default VPC
    - Public access: No
    - Create new security group: nerdwork-db-sg
  9. Database options:
    - Initial database name: nerdwork_prod
  10. Click Create database (takes 5-10 minutes)

  Step 2: Create S3 Bucket

  1. Go to S3 Console → Click "Create bucket"
  2. Bucket name: nerdwork-assets-prod (must be globally unique)
  3. Region: US East (N. Virginia) us-east-1
  4. Object Ownership: ACLs disabled
  5. Block Public Access: Keep all checked
  6. Bucket Versioning: Enable
  7. Default encryption: Enable (SSE-S3)
  8. Click Create bucket

  Step 3: Create IAM User for Deployment

  1. Go to IAM Console → Users → Create user
  2. User name: nerdwork-deployer
  3. Access type: Programmatic access
  4. Permissions: Attach existing policies:
    - PowerUserAccess (for now - we'll restrict later)
  5. Download CSV with Access Key ID and Secret Key
  6. Keep these credentials safe!

  Step 4: Setup Parameter Store

  1. Go to Systems Manager → Parameter Store
  2. Create these parameters (click "Create parameter" for each):

  Database URL:
  - Name: /nerdwork/prod/DATABASE_URL
  - Type: SecureString
  - Value:
  postgresql://nerdwork_admin:[YOUR_PASSWORD]@[RDS_ENDPOINT]:5432/nerdwork_prod
  - (Get RDS endpoint from RDS console)

  JWT Secret:
  - Name: /nerdwork/prod/JWT_SECRET
  - Type: SecureString
  - Value: your-super-secure-jwt-secret-change-this

  S3 Config:
  - Name: /nerdwork/prod/S3_BUCKET_NAME
  - Type: String
  - Value: nerdwork-assets-prod

  Step 5: Local Setup (Run These Commands)

  # In your backend directory
  cd E:\apps\nerdwork_plus\backend

  # Install AWS CLI if not installed
  npm install -g aws-cli

  # Configure AWS credentials (use the IAM user you created)
  aws configure
  # AWS Access Key ID: [from step 3]
  # AWS Secret Access Key: [from step 3]
  # Default region: us-east-1
  # Output format: json

  # Install Serverless Framework
  npm install -g serverless

  # Install all dependencies
  npm run install:all

  Step 6: Create Serverless Config

  Create serverless.yml in your backend root:

  service: nerdwork-backend

  frameworkVersion: '3'

  provider:
    name: aws
    runtime: nodejs18.x
    region: us-east-1
    stage: prod

    iam:
      role:
        statements:
          - Effect: Allow
            Action:
              - ssm:GetParameter
              - ssm:GetParameters
            Resource: "arn:aws:ssm:us-east-1:*:parameter/nerdwork/prod/*"
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:PutObject
              - s3:DeleteObject
            Resource: "arn:aws:s3:::nerdwork-assets-prod/*"

  functions:
    auth-service:
      handler: services/auth-service/dist/lambda.handler
      events:
        - http:
            path: /auth/{proxy+}
            method: ANY
            cors: true
      timeout: 30

  plugins:
    - serverless-plugin-typescript