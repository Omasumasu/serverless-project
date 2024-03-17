ENDPOINT_URL=http://localhost:4000


# ユーザープールの作成
USER_POOL_ID=$(
aws cognito-idp create-user-pool \
    --pool-name MyUserPool \
    --query UserPool.Id \
    --output text \
    --endpoint-url ${ENDPOINT_URL} \
)

# ユーザープールクライアントの作成
CLIENT_ID=$(
aws cognito-idp create-user-pool-client \
    --client-name MyUserPoolClient \
    --user-pool-id ${USER_POOL_ID} \
    --output text \
    --query UserPoolClient.ClientId \
    --endpoint-url ${ENDPOINT_URL} \
)

echo "USER_POOL_ID=${USER_POOL_ID}"
echo "CLIENT_ID=${CLIENT_ID}"


