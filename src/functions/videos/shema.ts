import {z} from "zod";

export const uploadVideoSchema = z.object({
    body: z.object({
        file: z.string().openapi({description: "The base64 encoded video data", format: "binary"}),
    }).openapi('UploadVideoRequest')
})