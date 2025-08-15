import { FastifyInstance } from 'fastify';
import { NextAvailableDateService } from '@services/next-available-date.service';
import {
  nextAvailableDateParamsSchema,
  nextAvailableDateQuerySchema,
  nextAvailableDateResponseSchema,
  NextAvailableDateParams,
  NextAvailableDateQuery,
} from '@schemas/next-available-date.schema';
import fromZodSchema from 'zod-to-json-schema';

export default async function nextAvailableDateRoutes(fastify: FastifyInstance) {
  const nextAvailableDateService = new NextAvailableDateService(fastify.em);

  fastify.get<{
    Params: NextAvailableDateParams;
    Querystring: NextAvailableDateQuery;
  }>(
    '/:id/next-available-date',
    {
      schema: {
        description: 'Get the next available date for an accommodation',
        tags: ['Accommodations'],
        params: fromZodSchema(nextAvailableDateParamsSchema),
        querystring: fromZodSchema(nextAvailableDateQuerySchema),
        response: {
          200: fromZodSchema(nextAvailableDateResponseSchema),
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = nextAvailableDateParamsSchema.parse(request.params);
        const { from } = nextAvailableDateQuerySchema.parse(request.query);

        const fromDate = new Date(from);
        
        // Validate the date
        if (isNaN(fromDate.getTime())) {
          return reply.status(400).send({ message: 'Invalid date format' });
        }

        // Ensure the date is not in the past (allow today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (fromDate < today) {
          return reply.status(400).send({ message: 'Date cannot be in the past' });
        }

        const result = await nextAvailableDateService.findNextAvailableDate(id, fromDate);
        
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Accommodation not found') {
            return reply.status(404).send({ message: 'Accommodation not found' });
          }
          if (error.message.includes('No available date found')) {
            return reply.status(400).send({ message: error.message });
          }
        }
        
        fastify.log.error(error);
        return reply.status(500).send({ message: 'Internal server error' });
      }
    }
  );
}