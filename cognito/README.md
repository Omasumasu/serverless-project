# API GatewayとCognitoを連携させ認証を行う方法

## local
LocalでCognitoを模倣するためのmoto serverを起動させて、LambdaのCustomAuthorizerを追加することで実現します。

moto serverを起動させてユーザープールを作成する
```sh
bash init.sh $EMAIL $PASSWORD
````

出力されたUSER_POOL_ID,USER_CLIENT_IDを環境変数に設定します。



## AWS環境
AWS環境でCognitoを利用する場合は、CognitoのUser Poolを作成し、API GatewayのAuthorizerにCognitoのUser Poolを指定します。

```ts
httpApi: {
  authorizers: {
    AdminPoolAuthorizer: {
      type: 'jwt',
      audience: {
        Ref: 'AdminPoolClient'
      },
      identitySource: '$.headers.Authorization',
      issuerUrl: '$ISSUER_URL'
    }
  }
}
```

ここで作成したAuthorizerをAPI Gatewayのルートに指定します。

```ts
  functions: {
    getUsers: {
      handler: 'src/functions/users/handler.getUserHandler',
      events: [
        {
          http: {
            method: 'get',
            path: 'users',
            authorizer: {
              name: "AdminPoolAuthorizer",
              type: "request"
            }
          },
        },
      ]
    },
```

