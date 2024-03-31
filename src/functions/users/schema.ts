import {z} from "zod";
import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z)

export const createUserSchema = z.object({
    body: z.object({
        name: z.string().openapi({description: "The name of the user"}),
        nickName: z.string().min(1).max(10).optional().openapi({description: "The nickname of the user"}),
        email: z.string().email().openapi({description: "The email of the user"}),
    }).openapi('Object')
})

export const userSchema = z.object({
    id: z.string().openapi({description: "The ID of the user"}),
    name: z.string().openapi({description: "The name of the user"}),
    nickName: z.string().optional().openapi({description: "The nickname of the user"}),
    email: z.string().email().openapi({description: "The email of the user"}),
}).openapi('Object')