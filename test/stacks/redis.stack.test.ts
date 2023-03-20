import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RedisStack } from '../../src/stacks/redis.stack';

describe('RedisStack', () => {
  const app = new App();
  const stack = new RedisStack(app, 'TestRedisStack');

  const template = Template.fromStack(stack);

  it('creates the VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });

  it('creates the Redis Subnet Group', () => {
    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: 'GT-Redis-Subnet-Group',
    });
  });

  it('creates the Redis Security Group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for the redis cluster',
    });
  });

  it('creates the Redis Cache Cluster', () => {
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      Engine: 'redis',
      CacheNodeType: 'cache.t3.micro',
      NumCacheNodes: 1,
      ClusterName: 'GT-Dev-Cluster',
      EngineVersion: '6.2',
      PreferredMaintenanceWindow: 'fri:00:30-fri:01:30',
    });
  });
});
