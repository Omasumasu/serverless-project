import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'serverless-project',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin'],
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
    httpApi: {
      authorizers: {
        AdminPoolAuthorizer: {
          type: 'jwt',
          audience: {
            Ref: 'AdminPoolClient'
          },
          identitySource: '$.headers.Authorization',
          issuerUrl: '$ISSUER_URL'
        },
        LocalAdminPoolAuthorizer: {
          type: 'request',
          functionName: 'localAdminPoolAuthorizer',
          enableSimpleResponses: true
        }
      }
    }
  },
  // import the function via paths
  functions: {

    LocalAdminPoolAuthorizer: {
        handler: 'src/authorizer/handler.localAdminPoolAuthorizer'
    },
    getUsers: {
      handler: 'src/functions/users/handler.getUserHandler',
      events: [
        {
          http: {
            method: 'get',
            path: 'users',
            // @ts-ignore
            authorizer: '${opt:stage}' !== 'local' ? "AdminPoolAuthorizer" : "LocalAdminPoolAuthorizer",
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
