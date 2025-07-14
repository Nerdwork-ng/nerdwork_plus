import { Stack, StackProps, aws_rds as rds, aws_ec2 as ec2, aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';


interface DatabaseStackProps extends StackProps {
  vpcId: string;
  privateSubnetIds: string[];
  availabilityZones: string[];
  dbSecret: secretsmanager.ISecret;
}

export class DatabaseStack extends Stack {
  public readonly dbCluster: rds.IDatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Import the VPC by attributes to break the direct dependency
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVPC', {
      vpcId: props.vpcId,
      availabilityZones: props.availabilityZones,
      privateSubnetIds: props.privateSubnetIds,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Allow internal access to RDS Postgres',
      allowAllOutbound: true,
    });

    // You may need to pass the VPC CIDR as a prop if you want to keep this rule
    // dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(props.vpcCidr), ec2.Port.tcp(5432));

    this.dbCluster = new rds.DatabaseCluster(this, 'NerdworkDBCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_2,
      }),
      credentials: rds.Credentials.fromSecret(props.dbSecret),
      defaultDatabaseName: 'nerdwork',
      vpc,
      vpcSubnets: { subnets: vpc.privateSubnets },
      securityGroups: [dbSecurityGroup],
      writer: rds.ClusterInstance.provisioned('Instance1', {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      }),
      readers: [
        rds.ClusterInstance.provisioned('Instance2', {
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        }),
      ],
      removalPolicy: this.node.tryGetContext('env') === 'prod' ? undefined : RemovalPolicy.DESTROY,
    });
  }
}