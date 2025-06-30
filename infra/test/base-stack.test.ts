import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Template } from 'aws-cdk-lib/assertions';
import { BaseStack } from '../lib/base-stack';

test('BaseStack contains S3 Bucket and outputs for VPC and Secret', () => {
  const app = new cdk.App();

  // 🧪 Create mock VPC and Secret
  const vpc = new ec2.Vpc(app, 'MockVPC', { maxAzs: 1 });
  const dbSecret = new secretsmanager.Secret(app, 'MockSecret');

  // 🧪 Pass them into the stack
  const stack = new BaseStack(app, 'TestBaseStack', {
    vpc,
    dbSecret,
  });

  const template = Template.fromStack(stack);

  // ✅ Only test for what this stack owns
  template.hasResource('AWS::S3::Bucket', {});

  // ✅ Optional: check outputs exist
  template.hasOutput('VPCId', {});
  template.hasOutput('S3ComicBucket', {});
  template.hasOutput('DBSecretArn', {});
});
