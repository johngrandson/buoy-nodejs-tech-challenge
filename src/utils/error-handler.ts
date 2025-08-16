import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

export interface ErrorResponse {
  message: string;
  errors?: unknown;
}

export function handleRouteError(error: unknown, reply: FastifyReply): void {
  if (error instanceof ZodError) {
    reply.status(400).send({
      message: 'Validation error',
      errors: error.errors,
    } as ErrorResponse);
  } else if (error instanceof Error) {
    reply.status(400).send({
      message: error.message,
    } as ErrorResponse);
  } else {
    reply.status(400).send({
      message: 'An unexpected error occurred',
    } as ErrorResponse);
  }
}
