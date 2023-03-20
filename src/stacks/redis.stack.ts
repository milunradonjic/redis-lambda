import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnCacheCluster, CfnSubnetGroup } from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

// Define constants
const STACK_NAME = 'RedisStack';

export class RedisStack extends Stack {
  // Define public properties
  public readonly vpc: Vpc;
  public readonly redisSecurityGroup;
  public readonly redisCache: CfnCacheCluster;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC with public and private subnets
    this.vpc = new Vpc(this, `${STACK_NAME}Vpc`, {
      maxAzs: 1,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: `${STACK_NAME}PublicSubnet`,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: `${STACK_NAME}PrivateSubnet`,
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create a subnet group for the Redis cluster
    const redisSubnetGroup = new CfnSubnetGroup(
      this,
      `${STACK_NAME}redisSubnetGroup`,
      {
        description: 'Subnet group for the redis cluster',
        subnetIds: this.vpc.publicSubnets.map((ps) => ps.subnetId),
        cacheSubnetGroupName: 'GT-Redis-Subnet-Group',
      },
    );

    // Create a security group for the Redis cluster
    this.redisSecurityGroup = new SecurityGroup(
      this,
      `${STACK_NAME}redisSecurityGroup`,
      {
        vpc: this.vpc,
        allowAllOutbound: true,
        description: 'Security group for the redis cluster',
      },
    );

    // Create a Redis cluster
    this.redisCache = new CfnCacheCluster(
      this,
      `${STACK_NAME}redisCache`,
      {
        engine: 'redis',
        cacheNodeType: 'cache.t3.micro',
        numCacheNodes: 1,
        clusterName: 'GT-Dev-Cluster',
        vpcSecurityGroupIds: [this.redisSecurityGroup.securityGroupId],
        cacheSubnetGroupName: redisSubnetGroup.ref,
        engineVersion: '6.2',
        preferredMaintenanceWindow: 'fri:00:30-fri:01:30',
      },
    );

    // Add dependency between Redis cache cluster and subnet group to ensure the subnet group is created first
    this.redisCache.addDependency(redisSubnetGroup);

    // Add outputs for Redis cache endpoint URL and port
    new CfnOutput(this, `${STACK_NAME}CacheEndpointUrl`, {
      value: this.redisCache.attrRedisEndpointAddress,
    });

    new CfnOutput(this, `${STACK_NAME}CachePort`, {
      value: this.redisCache.attrRedisEndpointPort,
    });
  }
}
