// lib/app-stack.ts
import { Stack, StackProps, aws_ec2 as ec2, aws_ecs as ecs, aws_ecs_patterns as ecsPatterns } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface AppStackProps extends StackProps {
  vpc: ec2.IVpc;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'NerdworkCluster', {
      vpc: props.vpc,
    });

    new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'NerdworkFargateService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      listenerPort: 80,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        containerPort: 80,
      },
      publicLoadBalancer: true,
    });
  }
}
