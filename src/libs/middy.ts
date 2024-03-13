import middy, { MiddyfiedHandler } from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import httpResponseSerializer from '@middy/http-response-serializer';
import validator from '@middy/validator';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler as AWSHandler } from 'aws-lambda';
import {transpileSchema} from "@middy/validator/transpile";
// Event is an APIGatewayProxyEvent with a typed body, pathParameters and queryStringParameters which depends on http-json-body-parser & json-schema-to-ts
// queryStringParameters and multiValueQueryStringParameters is non-nullable as we use http-event-normalizer
export interface Event<TBody, TPathParameters, TQueryStringParameters>
  extends Omit<APIGatewayProxyEvent, 'body' | 'pathParameters' | 'queryStringParameters'> {
  body: TBody;
  pathParameters: TPathParameters;
  queryStringParameters: TQueryStringParameters;
  multiValueQueryStringParameters: NonNullable<APIGatewayProxyEvent['multiValueQueryStringParameters']>;
}

// We are making use of http-response-serializer, so our body type can either be an Entity, an Array<Entity> or a string
interface Result extends Omit<APIGatewayProxyResult, 'body'> {
  body:
    | string
    | Record<string, unknown>;
}

// Handler type which gives us proper types on our event based on TBody and TPathParameters which are JSON schemas
export type CustomizedHandler<TBody = void, TPathParameters = void, TQueryStringParameters = void> = AWSHandler<
  Event<TBody, TPathParameters, TQueryStringParameters>,
  Result
>;

export const middyfy = (
  handler: CustomizedHandler<never, never, never>,
  requestSchema: Record<string, unknown> | null = null,
): MiddyfiedHandler<Event<never, never, never>, Result, Error, Context> => {
  const wrapper = middy(handler).use(middyJsonBodyParser()).use(httpEventNormalizer());

  if (requestSchema) {
    wrapper.use(
      validator({
        eventSchema: transpileSchema(requestSchema),
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
      }),
    );

  return wrapper;
};