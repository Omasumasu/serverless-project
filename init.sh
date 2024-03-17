ENDPOINT_URL=http://localhost:4000

# 第一引数にEメールアドレス、第二引数にパスワードをもらう
if [ $# -ne 2 ]; then
    echo "引数が足りません"
    exit 1
fi

EMAIL=$1
PASSWORD=$2

# ユーザープールの作成
USER_POOL_ID=$(
aws cognito-idp create-user-pool \
    --pool-name AdminPool \
    --query UserPool.Id \
    --output text \
    --endpoint-url ${ENDPOINT_URL} \
)

# ユーザープールクライアントの作成
CLIENT_ID=$(
aws cognito-idp create-user-pool-client \
    --client-name AdminPoolClient \
    --user-pool-id ${USER_POOL_ID} \
    --output text \
    --query UserPoolClient.ClientId \
    --endpoint-url ${ENDPOINT_URL} \
)

# 作成したユーザープールに対して、ユーザーを作成
aws cognito-idp sign-up \
    --client-id ${CLIENT_ID} \
    --username ${EMAIL} \
    --password ${PASSWORD} \
    --endpoint-url ${ENDPOINT_URL} \

# 作成したユーザーを確認
aws cognito-idp admin-confirm-sign-up \
    --user-pool-id ${USER_POOL_ID} \
    --username ${EMAIL} \
    --endpoint-url ${ENDPOINT_URL} \

# 作成したユーザーのトークンを取得
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id ${USER_POOL_ID} \
  --client-id ${CLIENT_ID} \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=${EMAIL},PASSWORD=${PASSWORD} \
  --query "AuthenticationResult.AccessToken" \
  --output text \
  --endpoint-url ${ENDPOINT_URL} | sed "s/\"//g")

echo "TOKEN=${TOKEN}"
echo "USER_POOL_ID=${USER_POOL_ID}"
echo "CLIENT_ID=${CLIENT_ID}"


