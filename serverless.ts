import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'serverless-project',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'ap-northeast-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    httpApi: {
      cors: true,
      authorizers: {
        OperatorPoolAuthorizer: {
          type: 'jwt',
          audience: {
            Ref: 'OperatorUserPoolClient'
          },
          identitySource: '$request.header.Authorization',
          issuerUrl: {
            'Fn::Join': [
              '',
              [
                'https://cognito-idp.',
                {
                  Ref: 'AWS::Region'
                },
                '.amazonaws.com/',
                {
                  Ref: 'OperatorUserPool'
                }
              ]
            ]
          }
        },
        LocalOperatorPoolAuthorizer: {
          type: 'request',
          functionName: 'LocalOperatorPoolAuthorizer',
          enableSimpleResponses: true
        },
        NursingCareProviderPoolAuthorizer: {
          type: 'jwt',
          audience: {
              Ref: 'NursingCareProviderUserPoolClient'
          },
          identitySource: '$request.header.Authorization',
          issuerUrl: {
            'Fn::Join': [
              '',
              [
                'https://cognito-idp.',
                {
                  Ref: 'AWS::Region'
                },
                '.amazonaws.com/',
                {
                  Ref: 'NursingCareProviderUserPool'
                }
              ]
            ]
          }
        },
      }
    },
    stage: "${opt:stage, 'local'}",
  },
  // import the function via paths
  functions: {

    LocalOperatorPoolAuthorizer: {
        handler: 'src/authorizer/handler.localOperatorPoolAuthorizer'
    },
    getUsers: {
      handler: 'src/functions/users/handler.getUserHandler',
      events: [
        {
          httpApi: {
            method: 'get',
            path: '/users',
            authorizer: {
              name: 'OperatorPoolAuthorizer',
            }
          },
        },
      ]
    },
    createUser: {
      handler: 'src/functions/users/handler.postUserHandler',
      events: [
        {
          httpApi: {
            method: 'post',
            path: '/users',
          },
        },
      ]
    },
    getOpenApiSpecification: {
      handler: 'src/functions/users/handler.getOpenApiSpecificationHandler',
      events: [
        {
          httpApi: {
            method: 'get',
            path: '/openapi.json',
          },
        },
      ]
    },
  },
  resources: {
    Resources: {
      OperatorUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'OperatorUserPool',
          UsernameAttributes: ['email'],
          AutoVerifiedAttributes: ['email'],
          Policies: {
            PasswordPolicy: {
              MinimumLength: 8,
              RequireLowercase: true,
              RequireNumbers: true,
              RequireSymbols: true,
              RequireUppercase: true,
            },
          },
          Schema: [
            {
              Name: 'email',
              Required: true,
              Mutable: false,
            },
          ],
        },
      },
      OperatorUserPoolClient: {
          Type: 'AWS::Cognito::UserPoolClient',
          Properties: {
              ClientName: 'OperatorUserPoolClient',
              UserPoolId: { Ref: 'OperatorUserPool' },
              GenerateSecret: false,
              ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
          },
      },
      NursingCareProviderUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'NursingCareProviderUserPool',
          UsernameAttributes: ['email'],
          AutoVerifiedAttributes: ['email'],
          Policies: {
            PasswordPolicy: {
              MinimumLength: 8,
              RequireLowercase: true,
              RequireNumbers: true,
              RequireSymbols: true,
              RequireUppercase: true,
            },
          },
          Schema: [
            {
              Name: 'email',
              Required: true,
              Mutable: false,
            },
          ],
        },
      },
      NursingCareProviderUserPoolClient: {
          Type: 'AWS::Cognito::UserPoolClient',
          Properties: {
              ClientName: 'NursingCareProviderUserPoolClient',
              UserPoolId: { Ref: 'NursingCareProviderUserPool' },
              GenerateSecret: false,
              ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
          },
      },
    }
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
