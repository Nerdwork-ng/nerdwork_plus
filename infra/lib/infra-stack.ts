import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface InfraStackProps extends cdk.StackProps {
  environment: string;
  databasePassword: string;
  jwtSecret: string;
}

export class InfraStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly database: rds.DatabaseInstance;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const { environment, databasePassword, jwtSecret } = props;

    // VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'NerdworkVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 1, // Cost optimization - use 1 NAT gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'NerdworkCluster', {
      vpc: this.vpc,
      clusterName: `nerdwork-${environment}-cluster`,
      containerInsights: true,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: this.vpc,
      internetFacing: true,
      loadBalancerName: `nerdwork-${environment}-alb`,
    });

    // Database
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromPassword('nerdwork', cdk.SecretValue.unsafePlainText(databasePassword)),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      databaseName: 'nerdworkdb',
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: environment === 'production',
      removalPolicy: environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for file storage
    const filesBucket = new s3.Bucket(this, 'FilesBucket', {
      bucketName: `nerdwork-${environment}-files-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: environment === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'CDN', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: filesBucket,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      comment: `Nerdwork+ CDN - ${environment}`,
    });

    // Store configuration in SSM Parameter Store
    new ssm.StringParameter(this, 'DatabaseURL', {
      parameterName: `/nerdwork/${environment}/database-url`,
      stringValue: `postgresql://nerdwork:${databasePassword}@${this.database.instanceEndpoint.hostname}:5432/nerdworkdb`,
      type: ssm.ParameterType.SECURE_STRING,
    });

    new ssm.StringParameter(this, 'JWTSecret', {
      parameterName: `/nerdwork/${environment}/jwt-secret`,
      stringValue: jwtSecret,
      type: ssm.ParameterType.SECURE_STRING,
    });

    new ssm.StringParameter(this, 'S3BucketName', {
      parameterName: `/nerdwork/${environment}/s3-bucket-name`,
      stringValue: filesBucket.bucketName,
    });

    new ssm.StringParameter(this, 'CloudFrontDomain', {
      parameterName: `/nerdwork/${environment}/cloudfront-domain`,
      stringValue: distribution.distributionDomainName,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      exportName: `${environment}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      exportName: `${environment}-DB-Endpoint`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `${environment}-ALB-DNS`,
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: this.cluster.clusterName,
      exportName: `${environment}-ECS-Cluster`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      exportName: `${environment}-S3-Bucket`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      exportName: `${environment}-CloudFront-Domain`,
    });
  }
}
