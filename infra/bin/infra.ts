import * as cdk from 'aws-cdk-lib';
import { SharedInfraStack } from '../lib/shared/shared-infra';
import { BaseStack } from '../lib/base-stack';
import { DatabaseStack } from '../lib/database-stack';
// import { AuthStack } from '../lib/auth-stack';

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

// const authStack = new AuthStack(app, 'AuthStack', {
//   env,
//   vpc: sharedInfra.vpc, // Pass if needed
//   dbSecret: sharedInfra.dbSecret, // Pass if needed
//   dbCluster: databaseStack.dbCluster,
// });

// Explicit dependencies
databaseStack.addDependency(sharedInfra);
baseStack.addDependency(databaseStack);
// authStack.addDependency(databaseStack);