import { FastifyPluginAsync } from 'fastify';
import { Accommodation } from '../entities/accommodation.entity';
import {
  AccommodationSchema,
  AccommodationInput,
  AccommodationParamsSchema,
} from '../schemas/accommodation.schema';
import { PaginationQuerySchema, PaginationResponse } from '@schemas/pagination.schema';
import fromZodSchema from 'zod-to-json-schema';

const accommodationRoutes: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: typeof PaginationQuerySchema._type }>(
    '/',
    {
      schema: {
        description: 'Get all accommodations with pagination',
        tags: ['Accommodations'],
        querystring: fromZodSchema(PaginationQuerySchema),
      },
    },
    async (request): Promise<PaginationResponse<Accommodation>> => {
      const { page, limit } = PaginationQuerySchema.parse(request.query);
      const offset = (page - 1) * limit;

      const [accommodations, total] = await fastify.em.findAndCount(Accommodation, {}, {
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: accommodations,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }
  );

  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get accommodation by ID',
        tags: ['Accommodations'],
        params: fromZodSchema(AccommodationParamsSchema),
      },
    },
    async (request, reply) => {
      const { id } = AccommodationParamsSchema.parse(request.params);
      const accommodation = await fastify.em.findOne(Accommodation, { id });

      if (!accommodation) {
        return reply.status(404).send({ message: 'Accommodation not found' });
      }

      return accommodation;
    }
  );

  fastify.post<{ Body: AccommodationInput }>(
    '/',
    {
      schema: {
        description: 'Create a new accommodation',
        tags: ['Accommodations'],
        body: fromZodSchema(AccommodationSchema),
      },
    },
    async (request, reply) => {
      try {
        const data = AccommodationSchema.parse(request.body);
        const accommodation = fastify.em.create(Accommodation, data);
        await fastify.em.persistAndFlush(accommodation);
        return reply.status(201).send(accommodation);
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );
};

export default accommodationRoutes;
