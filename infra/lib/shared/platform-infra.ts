import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface PlatformInfraProps {
  scope: Construct;
}

export class PlatformInfra {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct) {
    this.vpc = new ec2.Vpc(scope, 'PlatformVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    this.dbSecret = new secretsmanager.Secret(scope, 'PlatformDBSecret', {
      secretName: 'nerdwork-db-secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });
  }
}
