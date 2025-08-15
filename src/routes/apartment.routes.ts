import { FastifyPluginAsync } from 'fastify';
import { Apartment } from '@entities/apartment.entity';
import { ApartmentSchema, ApartmentInput, ApartmentParamsSchema } from '@schemas/apartment.schema';
import { PaginationQuerySchema, PaginationResponse } from '@schemas/pagination.schema';
import fromZodSchema from 'zod-to-json-schema';

const apartmentRoutes: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: typeof PaginationQuerySchema._type }>(
    '/',
    {
      schema: {
        description: 'Get all apartments with pagination',
        tags: ['Apartments'],
        querystring: fromZodSchema(PaginationQuerySchema),
      },
    },
    async (request): Promise<PaginationResponse<Apartment>> => {
      const { page, limit } = PaginationQuerySchema.parse(request.query);
      const offset = (page - 1) * limit;

      const [apartments, total] = await fastify.em.findAndCount(Apartment, {}, {
        limit,
        offset,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: apartments,
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
        description: 'Get apartment by ID',
        tags: ['Apartments'],
        params: fromZodSchema(ApartmentParamsSchema),
      },
    },
    async (request, reply) => {
      const { id } = ApartmentParamsSchema.parse(request.params);
      const apartment = await fastify.em.findOne(Apartment, { id });

      if (!apartment) {
        return reply.status(404).send({ message: 'Apartment not found' });
      }

      return apartment;
    }
  );

  fastify.post<{ Body: ApartmentInput }>(
    '/',
    {
      schema: {
        description: 'Create a new apartment',
        tags: ['Apartments'],
        body: fromZodSchema(ApartmentSchema),
      },
    },
    async (request, reply) => {
      try {
        const data = ApartmentSchema.parse(request.body);
        const apartment = fastify.em.create(Apartment, data);
        await fastify.em.persistAndFlush(apartment);
        return reply.status(201).send(apartment);
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );
};

export default apartmentRoutes;
