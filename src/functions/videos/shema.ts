import {z} from "zod";

export const uploadVideoSchema = z.object({
    body: z.object({
        data: z.string().openapi({description: "The base64 encoded video data"}),
        key: z.string().openapi({description: "The key to store the video"}),
    }).openapi('UploadVideoRequest')
})