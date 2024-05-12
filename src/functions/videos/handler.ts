import {CustomizedHandler, middyfy} from "@libs/middy";
import {S3} from "aws-sdk";
import multipartBodyParser from "@middy/http-multipart-body-parser";


const s3 = new S3();
const bucketName = process.env.BUCKET_NAME ?? 'sample-bucket-x125xyz';

const uploadVideo: CustomizedHandler<any> = async (event) => {
    try {
        const file = event.body.file;
        const key = event.body?.key || `videos/${file.filename}`;

        if (!file || !file.content) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'ビデオファイルが不足しています' }),
            };
        }

        await s3
            .putObject({
                Bucket: bucketName,
                Key: key,
                Body: file.content,
                ContentType: file.contentType || 'video/mp4',
            })
            .promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ビデオが正常にアップロードされました', key }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'ビデオのアップロードに失敗しました', error: (error as Error).message }),
        };
    }
};
export const uploadVideoHandler = middyfy(uploadVideo).use(multipartBodyParser());