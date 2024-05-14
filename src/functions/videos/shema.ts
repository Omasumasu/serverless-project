import {z} from "zod";

export const uploadVideoSchema = z.object({
    body: z.object({
        key: z.string().openapi({description: "The key of the video"}),
    }).openapi('UploadVideoRequest')
})