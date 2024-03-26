import middy, { MiddyfiedHandler } from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import httpResponseSerializer from '@middy/http-response-serializer';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler as AWSHandler } from 'aws-lambda';
import {zodValidator} from "@dannywrayuk/middy-zod-validator";
import {z, ZodSchema, ZodType} from "zod";
// Event is an APIGatewayProxyEvent with a typed body, pathParameters and queryStringParameters which depends on http-json-body-parser & json-schema-to-ts
// queryStringParameters and multiValueQueryStringParameters is non-nullable as we use http-event-normalizer
export interface Event<TBody, TPathParameters, TQueryStringParameters>
    extends Omit<APIGatewayProxyEvent, 'body' | 'pathParameters' | 'queryStringParameters'> {
  body: TBody extends ZodType<any, any> ? z.infer<TBody> : never;
  pathParameters: TPathParameters;
  queryStringParameters: TQueryStringParameters;
  multiValueQueryStringParameters: NonNullable<APIGatewayProxyEvent['multiValueQueryStringParameters']>;
}

// CustomizedHandlerの型を更新します。TBodyはZodスキーマを受け取るようになります
export type CustomizedHandler<TBody = void, TPathParameters = void, TQueryStringParameters = void> = AWSHandler<
    Event<TBody, TPathParameters, TQueryStringParameters>,
    Result
>;

// We are making use of http-response-serializer, so our body type can either be an Entity, an Array<Entity> or a string
interface Result extends Omit<APIGatewayProxyResult, 'body'> {
  body:
    | string
    | Record<string, unknown>;
}

const logBodyMiddleware = () => {
  return {
    before: async (request) => {
      console.log("Parsed body:", request.event.body);
    },
    after: async (response) => {
        console.log("Response body:", response.body);
    }
  };
};

export const middyfy = (
  handler: CustomizedHandler<ZodType<any, any>, never, never>,
  requestSchema?: ZodSchema<any>,
): MiddyfiedHandler<Event<ZodType<any, any>, never, never>, Result, Error, Context> => {
  const wrapper = middy(handler).use(middyJsonBodyParser()).use(logBodyMiddleware()).use(httpEventNormalizer());

  if (requestSchema) {
    wrapper.use(
      zodValidator({
        eventSchema: requestSchema,
      }),
    );
  }

  // httpResponseSerializer should come last, and httpErrorHandler second last
  wrapper
    .use(httpErrorHandler({}))
    .use(
      httpResponseSerializer({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
          {
            regex: /^text\/(html|plain)$/,
            serializer: ({ body }) => body,
          },
        ],
        defaultContentType: 'application/json'
      }),
    );

  return wrapper;
};