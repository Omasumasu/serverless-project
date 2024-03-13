import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'serverless-project',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },
  // import the function via paths
  functions: {
    getUsers: {
      handler: 'src/functions/users/handler.getUserHandler',
      events: [
        {
          http: {
            method: 'get',
            path: 'users', 
          },
        },
      ]
    },
    createUser: {
      handler: 'src/functions/users/handler.postUserHandler',
      events: [
        {
          http: {
            method: 'post',
            path: 'users', 
          },
        },
      ]
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
