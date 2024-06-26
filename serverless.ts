import type {AWS} from '@serverless/typescript';

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
        iamRoleStatements: [
            {
                Effect: 'Allow',
                Action: [
                    "s3:ListBucket",
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                Resource: "*"
            }
        ],
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
                HelperPoolAuthorizer: {
                    type: 'jwt',
                    audience: {
                        Ref: 'HelperUserPoolClient'
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
                                    Ref: 'HelperUserPool'
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
        uploadVideo: {
            handler: 'src/functions/videos/handler.uploadVideoHandler',
            role: { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] },
            events: [
                {
                    httpApi: {
                        method: 'post',
                        path: '/videos',
                    },
                },
            ]
        }
    },
    resources: {
        Resources: {
            LambdaExecutionRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: 'LambdaExecutionRole',
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: {
                                    Service: 'lambda.amazonaws.com'
                                },
                                Action: 'sts:AssumeRole'
                            }
                        ]
                    },
                    Policies: [
                        {
                            PolicyName: 'LambdaExecutionPolicy',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['s3:ListBucket', 's3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                                        Resource: ['arn:aws:s3:::sample-bucket-x125xyz', 'arn:aws:s3:::sample-bucket-x125xyz/*']
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            Bucket: {
                Type: 'AWS::S3::Bucket',
                Properties: {
                    BucketName: 'sample-bucket-x125xyz'
                }
            },
            BucketPolicy: {
                Type: 'AWS::S3::BucketPolicy',
                Properties: {
                    Bucket: { Ref: 'Bucket' },
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: {
                                    AWS: { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] }
                                },
                                Action: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
                                Resource: ['arn:aws:s3:::sample-bucket-x125xyz/*']
                            },
                            {
                                Effect: 'Deny',
                                Principal: '*',
                                Action: ['s3:PutObject'],
                                Resource: ['arn:aws:s3:::sample-bucket-x125xyz/*'],
                                Condition: {
                                    StringNotEquals: {
                                        'aws:PrincipalArn': { 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] }
                                    }
                                }
                            }
                        ]
                    }
                }
            },
            AdminUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: 'AdminUserPool',
                    Schema: [
                        {Name: 'email', Required: true, Mutable: true},
                        {Name: 'family_name', Required: true, Mutable: true},
                        {Name: 'given_name', Required: true, Mutable: true},
                        {Name: 'custom:corporate_id', AttributeDataType: 'String', Mutable: true},
                        {Name: 'custom:facility_ids', AttributeDataType: 'String', Mutable: true}
                    ],
                    Policies: {
                        PasswordPolicy: {
                            MinimumLength: 8,
                            RequireLowercase: false,
                            RequireNumbers: false,
                            RequireSymbols: false,
                            RequireUppercase: false,
                        }
                    },
                    EmailConfiguration: {
                        // SESを使用しないデフォルトの設定
                        EmailSendingAccount: 'COGNITO_DEFAULT'
                    },
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: true,
                        UnusedAccountValidityDays: 30,
                        InviteMessageTemplate: {
                            EmailSubject: "デジタルOHATアカウント作成完了通知",
                            EmailMessage: "{username}でアカウントが作成されました。仮パスワードは {####}です。\n 30日後に本パスワードの有効期限は切れます。"
                        }
                    },
                    AutoVerifiedAttributes: ['email']
                }
            },
            AdminUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: 'AdminUserPoolClient',
                    UserPoolId: {Ref: 'AdminUserPool'},
                    GenerateSecret: false,
                    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
                },
            },
            OperatorUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: 'OperatorUserPool',
                    Schema: [
                        {Name: 'email', Required: true, Mutable: true},
                        {Name: 'family_name', Required: true, Mutable: true},
                        {Name: 'given_name', Required: true, Mutable: true},
                    ],
                    Policies: {
                        PasswordPolicy: {
                            MinimumLength: 8,
                            RequireLowercase: false,
                            RequireNumbers: false,
                            RequireSymbols: false,
                            RequireUppercase: false,
                        }
                    },
                    EmailConfiguration: {
                        // SESを使用しないデフォルトの設定
                        EmailSendingAccount: 'COGNITO_DEFAULT'
                    },
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: true,
                        UnusedAccountValidityDays: 30,
                        InviteMessageTemplate: {
                            EmailSubject: "デジタルOHATオペレーター向けアカウント作成完了通知",
                            EmailMessage: "{username}でアカウントが作成されました。仮パスワードは {####}です。\n 30日後に本パスワードの有効期限は切れます。"
                        }
                    },
                    AutoVerifiedAttributes: ['email']
                }
            },
            OperatorUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: 'OperatorUserPoolClient',
                    UserPoolId: {Ref: 'OperatorUserPool'},
                    GenerateSecret: false,
                    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
                },
            },
            HelperUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: 'HelperUserPool',
                    Schema: [
                        {Name: 'username', AttributeDataType: 'String', Mutable: false},
                        {Name: 'family_name', Required: true, Mutable: true},
                        {Name: 'given_name', Required: true, Mutable: true},
                        {Name: 'custom:facility_ids', AttributeDataType: 'String', Mutable: true}
                    ],
                    Policies: {
                        PasswordPolicy: {
                            MinimumLength: 8,
                            RequireLowercase: true,
                            RequireNumbers: true,
                            RequireSymbols: true,
                            RequireUppercase: true,
                        }
                    },
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: false,
                        UnusedAccountValidityDays: 30,
                        InviteMessageTemplate: {
                            EmailSubject: "新しいヘルパーアカウントの初期パスワード",
                            EmailMessage: "新しいヘルパーアカウントが作成されました。アカウントIDは{username}です。初期パスワードは{####}です。このパスワードを指定されたヘルパーに安全に伝えてください。"
                        }
                    },
                    EmailConfiguration: {
                        // SESを使用しないデフォルトの設定
                        EmailSendingAccount: 'COGNITO_DEFAULT'
                    },
                    AutoVerifiedAttributes: ['email']
                }
            },
            HelperUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: 'HelperUserPoolClient',
                    UserPoolId: {Ref: 'HelperUserPool'},
                    GenerateSecret: false,
                    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH'],
                },
            },
        }
    },
    package: {individually: true},
    custom: {
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            // 'aws-sdk'を含める
            exclude: [],
            target: 'node20',
            define: {'require.resolve': undefined},
            platform: 'node',
            concurrency: 10,
        },
    },
};

module.exports = serverlessConfiguration;
