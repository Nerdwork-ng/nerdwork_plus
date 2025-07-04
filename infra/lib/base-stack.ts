import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds'

interface BaseStackProps extends StackProps {
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
  dbCluster?: rds.IDatabaseCluster
}

export class BaseStack extends Stack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const { vpc, dbSecret , dbCluster } = props;

    // ✅ Only create S3 here — VPC and Secret come from props
    const storageBucket = new s3.Bucket(this, 'ComicMediaBucket', {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    if (dbCluster) {
      // Example: Access dbCluster.clusterEndpoint.hostname
      console.log(`Database endpoint: ${dbCluster.clusterEndpoint.hostname}`);
    }
  }
}
