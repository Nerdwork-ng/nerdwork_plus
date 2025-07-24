// bin/infra.ts
import * as cdk from 'aws-cdk-lib';
import { SharedInfraStack } from '../lib/shared-infra-stack';
import { BaseStack } from '../lib/base-stack';
// import { DatabaseStack } from '../lib/database-stack';
import { AuthStack } from '../lib/auth-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const sharedInfra = new SharedInfraStack(app, 'SharedInfraStack', { env });

// const database = new DatabaseStack(app, 'DatabaseStack', {
//   env,
//   vpc: sharedInfra.vpc,
//   dbSecret: sharedInfra.dbSecret,
// });

const auth = new AuthStack(app, 'AuthStack', {
  vpc: sharedInfra.vpc,
  dbSecret: sharedInfra.dbSecret,
  // dbCluster: db.dbCluster, // if needed and exported from DatabaseStack
});

const base = new BaseStack(app, 'BaseStack', { env });