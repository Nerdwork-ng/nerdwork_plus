import * as cdk from 'aws-cdk-lib';
import { SharedInfraStack } from '../lib/shared/shared-infra-stack';
import { BaseStack } from '../lib/base-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const sharedInfra = new SharedInfraStack(app, 'SharedInfraStack', { env });

const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  env,
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
});

const baseStack = new BaseStack(app, 'BaseStack', {
  env,
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
  dbCluster: databaseStack.dbCluster,
});

const authStack = new AuthStack(app, 'AuthStack', {
  env,
  dbCluster: databaseStack.dbCluster,
});

// Explicit dependencies
databaseStack.addDependency(sharedInfra); // DatabaseStack depends on SharedInfraStack
baseStack.addDependency(databaseStack);   // BaseStack depends on DatabaseStack
authStack.addDependency(databaseStack);   // AuthStack depends on DatabaseStack