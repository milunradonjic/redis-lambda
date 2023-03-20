import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { LambdaStack } from '../../src/stacks/lambda.stack';
import { RedisStack } from '../../src/stacks/redis.stack';

describe('LambdaStack', () => {
  const app = new App();
  const redisStack = new RedisStack(app, 'TestRedisStack');
  const lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
    redisCache: redisStack.redisCache,
    vpc: redisStack.vpc,
    redisSG: redisStack.redisSecurityGroup,
  });

  const template = Template.fromStack(lambdaStack);

  it('creates the Lambda role with the correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::aws:policy/AmazonElastiCacheFullAccess',
            ],
          ],
        },
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::aws:policy/service-role/AWSLambdaENIManagementAccess',
            ],
          ],
        },
      ],
    });
  });

  it('check if the Security Group ingress rule is correctly set up', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 6379,
      ToPort: 6379,
    });
  });

  it('check if AWS::EC2::SecurityGroupEgress rules are present', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupEgress: [
        Match.objectLike({
          IpProtocol: '-1',
        }),
      ],
    });
  });
});
