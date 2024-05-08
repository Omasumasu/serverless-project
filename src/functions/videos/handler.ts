import {CustomizedHandler, middyfy} from "@libs/middy";
import {z, ZodType} from "zod";
import {S3} from "aws-sdk";
import {uploadVideoSchema} from "@functions/videos/shema";

const s3 = new S3();
const bucketName = process.env.BUCKET_NAME ?? 'sample-bucket-x125xy';

const uploadVideo: CustomizedHandler<ZodType<z.infer<typeof uploadVideoSchema>['body']>> = async (event) => {
    try {
        const { data, key } = event.body;

        const buffer = Buffer.from(data, 'base64');

        await s3
            .putObject({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentEncoding: 'base64',
                ContentType: 'video/mp4',
            })
            .promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Video uploaded successfully', key }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to upload video', error: error.message }),
        };
    }
};
export const uploadVideoHandler = middyfy(uploadVideo)