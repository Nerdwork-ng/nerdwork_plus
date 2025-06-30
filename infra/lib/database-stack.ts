import { Stack, StackProps, aws_rds as rds, aws_ec2 as ec2, aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.IVpc, dbSecret: secretsmanager.ISecret }) {
    super(scope, id, props);

    // 🔐 Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: props.vpc,
      description: 'Allow internal access to RDS Postgres',
      allowAllOutbound: true,
    });

    // ⚠️ Only allow internal services (e.g., ECS, Lambdas)
    dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(props.vpc.vpcCidrBlock), ec2.Port.tcp(5432));

    // 🧠 Aurora PostgreSQL cluster
    const dbCluster = new rds.DatabaseCluster(this, 'NerdworkDBCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_2,
      }),
      credentials: rds.Credentials.fromSecret(props.dbSecret),
      defaultDatabaseName: 'nerdwork',
      instances: 2,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [dbSecurityGroup],
      },
      removalPolicy: this.node.tryGetContext('env') === 'prod'
        ? undefined
        : RemovalPolicy.DESTROY, // destroy for dev/staging
    });

    // Outputs
    this.exportValue(dbCluster.clusterEndpoint.hostname, { name: 'RDSClusterEndpoint' });
  }
}
