
export const createUserBodySchema = {
    type: "object",
    properties: {
        name: { type: 'string' },
        nickName: { type: 'string' },
        email: { type: 'string', format: 'email' },
    },
    required: ['name', 'email']
} as const;

export const createUserSchema = {
    type: "object",
    properties: {
        body: createUserBodySchema
    },
    required: ['body']
} as const;


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