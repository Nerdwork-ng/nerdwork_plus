import { StackProps } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';

export interface SharedInfraProps extends StackProps {
  vpc: IVpc;
  dbSecret: ISecret;
}
