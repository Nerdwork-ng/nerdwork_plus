// lib/database-stack.ts
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface DatabaseStackProps extends StackProps {
  vpc: ec2.Vpc;
  dbSecret: secretsmanager.Secret;
}

// This stack is to create the RDS database cluster

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow internal RDS access',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(5432));

    new rds.DatabaseCluster(this, 'AppDBCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_2,
      }),
      credentials: rds.Credentials.fromSecret(props.dbSecret),
      // defaultDatabaseName: 'nerdwork', this ot be the name of the database 
      instances: 2,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [dbSecurityGroup],
      },
    });
  }
}
