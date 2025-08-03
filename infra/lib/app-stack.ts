import {
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecsPatterns,
  aws_logs as logs,
  aws_secretsmanager as secretsmanager,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface AppStackProps extends StackProps {
  vpc: ec2.IVpc;
  dbSecret: secretsmanager.ISecret;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'NerdworkCluster', {
      vpc: props.vpc, 
    });

    // Log group
    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Load-balanced Fargate Service
    new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'NerdworkService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      publicLoadBalancer: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // replace with your backend image
        containerPort: 80,
        environment: {
          NODE_ENV: 'production',
          DATABASE_NAME: 'nerdwork',
        },
        secrets: {
          DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, 'nerdwork_admin'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, 'password'),
        },
        logDriver: ecs.LogDriver.awsLogs({
          streamPrefix: 'nerdwork-app',
          logGroup,
        }),
      },
    });
  }
}
