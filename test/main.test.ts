import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaStack } from '../src/stacks/lambda.stack';
import { RedisStack } from '../src/stacks/redis.stack';

test('Snapshot', () => {
  const app = new App();
  const redisStack = new RedisStack(app, 'testRedis');
  const lambdaStack = new LambdaStack(app, 'testLambda', {
    redisCache: redisStack.redisCache,
    redisSG: redisStack.redisSecurityGroup,
    vpc: redisStack.vpc,
  });

  const redisTemplate = Template.fromStack(redisStack);
  const lambdaTemplate = Template.fromStack(lambdaStack);
  expect(redisTemplate.toJSON()).toMatchSnapshot();
  expect(lambdaTemplate.toJSON()).toMatchSnapshot();
});