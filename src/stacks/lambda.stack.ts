import path from 'path';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { CfnCacheCluster } from 'aws-cdk-lib/aws-elasticache';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

const STACK_NAME = 'LambdaStack';

interface LambdaStackProps extends StackProps {
  redisCache: CfnCacheCluster;
  vpc: Vpc;
  redisSG: SecurityGroup;
}
export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create a role for the Lambda function
    const lambdaRole = new Role(this, `${STACK_NAME}lambdaRole`, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });

    // Add managed policies to the Lambda role
    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('AmazonElastiCacheFullAccess'),
    );

    lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaENIManagementAccess',
      ),
    );

    // Create a security group for the Lambda function
    const lambdaSG = new SecurityGroup(this, `${STACK_NAME}lambdaSG`, {
      vpc: props.vpc,
      allowAllOutbound: true,
      securityGroupName: 'redis-lambdaFn Security Group',
    });

    // Allow the Lambda function to connect to the Redis cache
    lambdaSG.connections.allowTo(
      props.redisSG,
      Port.tcp(6379),
      'Allow this lambda function connect to the redis cache',
    );

    // Create a new Lambda function
    new NodejsFunction(this, `${STACK_NAME}lambdaFn`, {
      functionName: 'redis-lambdaFn',
      runtime: Runtime.NODEJS_14_X,
      handler: 'handler',
      entry: path.join(__dirname, '..', 'lambda', 'index.ts'),
      role: lambdaRole,
      timeout: Duration.seconds(200),
      vpc: props.vpc,
      securityGroups: [lambdaSG],
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      environment: {
        CACHE_URL: `redis://${props.redisCache.attrRedisEndpointAddress}:${props.redisCache.attrRedisEndpointPort}`,
      },
      bundling: {
        sourceMap: true,
        sourceMapMode: SourceMapMode.DEFAULT,
      },
    });
  }
}