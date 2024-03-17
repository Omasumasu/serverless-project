# 初期設定

## 必要ツールのインストール
asdfはバージョン管理ツールです。nodejs, aws-cliのバージョンを統一するために使用します。

`brew install asdf`
`asdf plugin add nodejs`
`asdf plugin add awscli`
`asdf install`
`aws --version`
`node -v`

## Cognitoユーザープールの作成
docker composeでローカル環境を構築します。
docker composeをダウンロードしておいてください。

`docker compose up -d`

`bash init.sh $EMAIL $PASSWORD`

返却されるUSER_POOL_IDとCLIENT_IDをメモしておいてください。

```
USER_POOL_ID=ap-northeast-1_229652e1b7ff49cf8746e7eb4eba65ae
```

# インストール
`npm install`

# 実行

## ローカル環境
`npm run dev`