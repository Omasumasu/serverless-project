import {APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent} from "aws-lambda";
import * as jwt from "jsonwebtoken";
import * as jwksRsa from "jwks-rsa";

// 環境変数からUser Pool IDとClient IDを読み込む
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const COGNITO_ISSUER = `http://localhost:4000/${USER_POOL_ID}`;
const JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

// JWKS clientを設定
const client = new jwksRsa.JwksClient({ // ここを修正しました
    jwksUri: JWKS_URI,
    cache: true,
    requestHeaders: {
        'Authorization': "AWS4-HMAC-SHA256 Credential=mock_access_key/20220524/us-east-1/cognito-idp/aws4_request, SignedHeaders=content-length;content-type;host;x-amz-date, Signature=asdf"
    }
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback){
    if (!header.kid) throw new Error("not found kid!");
    client.getSigningKey(header.kid, function (err, key) {
        if (err){
          console.error(err);
          throw err;
        }
        const signingKey = key.getPublicKey(); // keyがSigningKey型であることを確認
        callback(null, signingKey);
    });
}

export const localOperatorPoolAuthorizer = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    const token = event.authorizationToken.replace(/^Bearer\s/, '');
    try {
        await new Promise((resolve, reject) => {
            jwt.verify(token, getKey, {
                issuer: `https://cognito-idp.ap-northeast-1.amazonaws.com/${USER_POOL_ID}`,
                audience: CLIENT_ID,
            }, (error, decoded) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    console.log('result:', decoded)
                    resolve(decoded);
                }
            });
        });

        // トークンが有効な場合、APIへのアクセスを許可するポリシーを返す
        return generatePolicy('user', 'Allow', event.methodArn);
    } catch (error) {
        console.error(error);
        // トークンが無効な場合はアクセスを拒否
        return generatePolicy('user', 'Deny', event.methodArn);
    }
};

function generatePolicy(principalId: string, effect: string, resource: string): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
}
