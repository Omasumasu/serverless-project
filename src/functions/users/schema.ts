import {z} from "zod";

export const createUserSchema = z.object({
    body: z.object({
        name: z.string(),
        nickName: z.string().min(1).max(10).optional(),
        email: z.string().email(),
    })
})

export const userSchema = {
    type: "object",
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        nickName: { type: 'string' },
        email: { type: 'string', format: 'email' },
    },
    required: ['name', 'email', 'nickName']
} as const;