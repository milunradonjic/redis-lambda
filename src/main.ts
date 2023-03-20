import { App } from 'aws-cdk-lib';
import { LambdaStack } from './stacks/lambda.stack';
import { RedisStack } from './stacks/redis.stack';

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

const infrastructure = new RedisStack(app, 'RedisStack', {
  env: devEnv,
});

new LambdaStack(app, 'LambdaStack', {
  env: devEnv,
  redisCache: infrastructure.redisCache,
  redisSG: infrastructure.redisSecurityGroup,
  vpc: infrastructure.vpc,
});

app.synth();