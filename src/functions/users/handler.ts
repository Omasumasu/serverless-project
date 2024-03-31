import {createUserSchema, userSchema} from "@functions/users/schema";
import {CustomizedHandler, middyfy} from '@libs/middy';
import {z, ZodType} from "zod";
import {registry} from "../../registry";
import {OpenApiGeneratorV3} from "@asteasolutions/zod-to-openapi";

const getUser: CustomizedHandler = async (_) => {
    return {
        statusCode: 200,
        body: {
            id: 'Sample001',
            name: 'John Doe',
            nickName: 'JD',
            email: 'john.doe@example.com'
        }
    }
}

export const getUserHandler = middyfy(getUser)

const postUser: CustomizedHandler<ZodType<z.infer<typeof createUserSchema>['body']>> = async (event) => {
    return {
        statusCode: 201,
        body: {
            id: 'Sample001',
            name: event.body.name,
            nickName: event.body.nickName,
            email: event.body.email
        }
    }
}

export const postUserHandler = middyfy(postUser, createUserSchema)


registry.registerPath({
    method: 'post',
    path: '/users/',
    description: 'Create a new user',
    summary: 'Create a new user from information',
    request: {
        body: {
            description: 'User information',
            content: {
                'application/json': {
                    schema: createUserSchema,
                },
            },
        }
    },
    responses: {
        200: {
            description: 'User created successfully',
            content: {
                'application/json': {
                    schema: userSchema,
                },
            },
        },
        400: {
            description: 'Invalid input',
        },
        403: {
            description: 'Forbidden',
        }
    },
});


const docs = new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.0",
    info: { title: "API", version: "1.0.0" },
});

const getOpenApiSpecification: CustomizedHandler = async (_) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(docs)
    }
}

export const getOpenApiSpecificationHandler = middyfy(getOpenApiSpecification)