import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export interface PlatformInfraProps {}

export class PlatformInfra extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: PlatformInfraProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'PlatformVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: 'nerdwork-db-secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'nerdwork_admin',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password',
      },
    });
  }
}
