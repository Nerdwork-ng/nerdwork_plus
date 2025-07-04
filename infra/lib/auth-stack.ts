import { Stack, StackProps, aws_lambda as lambda } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds'

interface AuthStackProps extends StackProps{
  dbCluster?: rds.IDatabaseCluster;
}

export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const {dbCluster} = props;

    // Lambda function definition
    const authLambda = new lambda.Function(this, 'AuthHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../functions/auth')),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      description: 'Handles basic auth logic (MVP placeholder)',
    });


    // Use dbCluster if needed
    if (dbCluster) {
      // Example: Access dbCluster.clusterEndpoint.hostname
      console.log(`AuthStack using database endpoint: ${dbCluster.clusterEndpoint.hostname}`);
    }
  }
}
