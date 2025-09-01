#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Nerdwork+ AWS Deployment Script\n');

// Function to run commands with better error handling
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`💻 Running: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { ...process.env }
    });
    console.log(`✅ ${description} - Success`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Check AWS credentials
function checkAWSCredentials() {
  console.log('\n🔐 Checking AWS Credentials...');
  try {
    // Try to get current AWS identity
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    console.log('✅ AWS credentials are configured');
  } catch (error) {
    console.error('❌ AWS credentials not found or invalid');
    console.log('\n📋 Please configure AWS credentials first:');
    console.log('1. Install AWS CLI: https://aws.amazon.com/cli/');
    console.log('2. Run: aws configure');
    console.log('3. Or set environment variables:');
    console.log('   export AWS_ACCESS_KEY_ID=your_access_key');
    console.log('   export AWS_SECRET_ACCESS_KEY=your_secret_key');
    console.log('   export AWS_REGION=us-east-1');
    process.exit(1);
  }
}

// Main deployment function
async function deploy() {
  const stage = process.argv[2] || 'dev';
  
  console.log(`🎯 Deploying to stage: ${stage}`);
  
  // Step 1: Check prerequisites
  checkAWSCredentials();
  
  // Step 2: Install dependencies
  runCommand('npm run install:all', 'Installing dependencies for all services');
  
  // Step 3: Build all services
  runCommand('npm run build:services', 'Building all services');
  
  // Step 4: Deploy infrastructure (if CloudFormation template exists)
  if (fs.existsSync('./deployment/aws-infrastructure.yml')) {
    console.log('\n🏗️  Deploying infrastructure...');
    const stackName = `nerdwork-${stage}`;
    
    // Check if stack exists
    try {
      execSync(`aws cloudformation describe-stacks --stack-name ${stackName}`, { stdio: 'pipe' });
      console.log('📝 Updating existing CloudFormation stack');
      runCommand(
        `aws cloudformation update-stack --stack-name ${stackName} --template-body file://deployment/aws-infrastructure.yml --capabilities CAPABILITY_IAM`,
        'Updating CloudFormation stack'
      );
    } catch (error) {
      console.log('🆕 Creating new CloudFormation stack');
      runCommand(
        `aws cloudformation create-stack --stack-name ${stackName} --template-body file://deployment/aws-infrastructure.yml --capabilities CAPABILITY_IAM`,
        'Creating CloudFormation stack'
      );
    }
    
    // Wait for stack to complete
    runCommand(
      `aws cloudformation wait stack-create-complete --stack-name ${stackName}`,
      'Waiting for stack creation to complete'
    );
  }
  
  // Step 5: Deploy Lambda functions
  runCommand(`serverless deploy --stage ${stage}`, `Deploying Lambda functions to ${stage}`);
  
  // Step 6: Display endpoints
  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📡 API Endpoints:');
  
  try {
    const info = execSync(`serverless info --stage ${stage}`, { encoding: 'utf8' });
    console.log(info);
  } catch (error) {
    console.log('Run "serverless info --stage ' + stage + '" to see endpoints');
  }
  
  console.log('\n🔍 Next steps:');
  console.log('1. Test your endpoints');
  console.log('2. Configure environment variables in Parameter Store');
  console.log('3. Set up monitoring and alerts');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node deploy.js [stage]');
  console.log('Example: node deploy.js prod');
  console.log('Default stage: dev');
  process.exit(0);
}

// Run deployment
deploy().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});