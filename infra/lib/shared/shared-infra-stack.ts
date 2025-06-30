// lib/shared/shared-infra-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PlatformInfra } from './platform-infra';

export class SharedInfraStack extends Stack {
  public readonly vpc;
  public readonly dbSecret;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const infra = new PlatformInfra(this, 'PlatformInfra');

    this.vpc = infra.vpc;
    this.dbSecret = infra.dbSecret;
  }
}
