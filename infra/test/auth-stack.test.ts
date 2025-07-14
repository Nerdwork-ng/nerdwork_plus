import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { AuthStack } from '../lib/auth-stack';

test('AuthStack creates a Lambda function and IAM role', () => {
  const app = new cdk.App();
  const vpc = ec2.Vpc.fromVpcAttributes(app, 'MockVpc', {
    vpcId: 'vpc-12345',
    availabilityZones: ['us-east-1a'],
    publicSubnetIds: ['subnet-12345'],
  });
  const stack = new AuthStack(app, 'TestAuthStack', { vpc });

  const template = Template.fromStack(stack);

  // Assert a Lambda function exists
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
    Handler: 'handler.handler',
  });

  // Assert an IAM Role exists
  template.hasResourceProperties('AWS::IAM::Role', {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        },
      ],
    },
  });
});
