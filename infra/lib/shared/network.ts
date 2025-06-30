import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export function createPlatformVpc(scope: Construct): Vpc {
  return new Vpc(scope, 'PlatformVPC', {
    maxAzs: 2,
    natGateways: 1,
  });
}
