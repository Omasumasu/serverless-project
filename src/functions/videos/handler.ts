import {CustomizedHandler, middyfy} from "@libs/middy";
import {S3} from "aws-sdk";
import {z, ZodType} from "zod";
import {uploadVideoSchema} from "@functions/videos/shema";


const s3 = new S3();
const bucketName = process.env.BUCKET_NAME ?? 'sample-bucket-x125xyz';

const uploadVideo: CustomizedHandler<ZodType<z.infer<typeof uploadVideoSchema>['body']>> = async (event) => {
    const {key} = event.body;

    const signedUrl = s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: key,
        Expires: 60 * 5,
        ContentType: 'video/mp4'
    });

    return {
        statusCode: 200,
        body: {
            signedUrl
        }
    }
};
export const uploadVideoHandler = middyfy(uploadVideo);