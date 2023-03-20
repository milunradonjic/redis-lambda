import { DeployableAwsCdkTypeScriptApp } from 'deployable-awscdk-app-ts';
const project = new DeployableAwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  devDeps: ['deployable-awscdk-app-ts'],
  name: 'otofeller-task',
  projenrcTs: true,
  deps: [
    'redis',
  ],
  authorName: 'Milun Radonjic',
  authorEmail: 'milun.radonjic95@gmail.com',
  repository: 'https://github.com/milunradonjic/redis-lambda',
  packageName: 'redis-lambda',
});
project.synth();