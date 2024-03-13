import {createUserSchema} from "@functions/users/schema";
import {CustomizedHandler, middyfy} from '@libs/middy';
import {FromSchema} from "json-schema-to-ts";

const getUser: CustomizedHandler = async (_) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            id: 'Sample001',
            name: 'John Doe',
            nickName: 'JD',
            email: 'john.doe@example.com'
        })
    }
}

export const getUserHandler = middyfy(getUser)

const postUser: CustomizedHandler<FromSchema<typeof createUserSchema>> = async (event) => {
    return {
        statusCode: 201,
        body: JSON.stringify({
            id: 'Sample001',
            name: event.body.name,
            nickName: event.body.nickName,
            email: event.body.email
        })
    }
}

export const postUserHandler = middyfy(postUser, createUserSchema)