# Ottofeller Task

This project is an AWS CDK app that creates a simple Lambda function which interacts with an Amazon ElastiCache Redis cluster. The app is generated using Projen with the `deployable-awscdk-app-ts` template from [here](https://github.com/AminFazlMondo/deployable-awscdk-app-ts).

## Features 

- AWS CDK app generated using Projen
- Stack with a Redis replication group
  - Cluster mode disabled
  - VPC defined within the stack
- Stack with a Lambda function
  - Connects to the Redis cluster
  - Gets a value from the cluster and stores it if not already present
  - Sets a TTL of 1 hour for stored values
  - Preserves the Redis connection between Lambda invocations

## Prerequisites

- [Node.js](https://nodejs.org/en) >= 14.x
- [AWS CLI](https://aws.amazon.com/cli/) configured with a valid AWS account and appropriate permissions
- [Projen](https://github.com/projen/projen) installed globally or as a project dependency

## Getting Started

You might have to run `dk bootstrap [--profile <profile>]`

1. Clone the repository
```
git clone https://github.com/milunradonjic/ottofeller-task.git
cd ottofeller-task
```
2. Install dependencies:
```
npx projen
```
3. Build the project [Optional]
```
npx projen build
```
4. Synth [Optional]
```
npx projen synth
```
5. Deploy the project using an optional AWS CLI profile:
```
npx projen deploy --all [--profile <profile>]

```

*Note: 
You might have to run `cdk bootstrap [--profile <profile>]`
The --profile flag is optional. Use it if you want to specify a specific AWS CLI profile for deployment. 
Build and Synth are optional as well.*

## Testing

Run tests for the project:
```
npx projen test

```
