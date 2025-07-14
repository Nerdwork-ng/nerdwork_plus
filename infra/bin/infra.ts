import * as cdk from 'aws-cdk-lib';
import { SharedInfraStack } from '../lib/shared/shared-infra';
import { BaseStack } from '../lib/base-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};


// Create shared infra stack (VPC, secrets, etc.)
const sharedInfra = new SharedInfraStack(app, 'SharedInfraStack', { env });

// Create database stack, which depends on shared infra
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
});

// Create base stack, which depends on shared infra only (no dbCluster to avoid cycles)
const baseStack = new BaseStack(app, 'BaseStack', {
  env,
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
});

// Create auth stack, which depends on shared infra (and optionally dbSecret)
const authStack = new AuthStack(app, 'AuthStack', {
  env,
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
});

// If you need to use dbCluster in baseStack or authStack, consider passing only minimal info (like endpoint/ARN) after deployment, or refactor your stack design to avoid direct resource references.

// Explicit dependencies
// databaseStack.addDependency(sharedInfra);
// baseStack.addDependency(databaseStack);
// authStack.addDependency(databaseStack);