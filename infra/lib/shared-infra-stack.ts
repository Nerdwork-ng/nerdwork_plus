// lib/shared-infra-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { createPlatformVpc } from './shared/network';
import { createDatabaseSecret } from './shared/secrets';


// this is to create the vpc and the database secret
export class SharedInfraStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = createPlatformVpc(this);
    this.dbSecret = createDatabaseSecret(this);
  }
}
