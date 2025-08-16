import { FastifyPluginAsync } from 'fastify';
import { Hotel } from '@entities/hotel.entity';
import { HotelSchema, HotelInput, HotelParamsSchema } from '@schemas/hotel.schema';
import { PaginationQuerySchema, PaginationResponse } from '@schemas/pagination.schema';
import fromZodSchema from 'zod-to-json-schema';
import { handleRouteError } from '@/utils/error-handler';
import { paginate } from '@/utils/pagination';

const hotelRoutes: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: typeof PaginationQuerySchema._type }>(
    '/',
    {
      schema: {
        description: 'Get all hotels with pagination',
        tags: ['Hotels'],
        querystring: fromZodSchema(PaginationQuerySchema),
      },
    },
    async (request): Promise<PaginationResponse<Hotel>> => {
      const params = PaginationQuerySchema.parse(request.query);
      return paginate<Hotel>(fastify.em, Hotel, params);
    }
  );

  fastify.get(
    '/:id',
    {
      schema: {
        description: 'Get hotel by ID',
        tags: ['Hotels'],
        params: fromZodSchema(HotelParamsSchema),
      },
    },
    async (request, reply) => {
      const { id } = HotelParamsSchema.parse(request.params);
      const hotel = await fastify.em.findOne(Hotel, { id });

      if (!hotel) {
        return reply.status(404).send({ message: 'Hotel not found' });
      }

      return hotel;
    }
  );

  fastify.post<{ Body: HotelInput }>(
    '/',
    {
      schema: {
        description: 'Create a new hotel',
        tags: ['Hotels'],
        body: fromZodSchema(HotelSchema),
      },
    },
    async (request, reply) => {
      try {
        const data = HotelSchema.parse(request.body);
        const hotel = fastify.em.create(Hotel, { ...data, type: 'hotel' });
        await fastify.em.persistAndFlush(hotel);
        return reply.status(201).send(hotel);
      } catch (error) {
        handleRouteError(error, reply);
      }
    }
  );

  fastify.put<{ Params: typeof HotelParamsSchema._type; Body: HotelInput }>(
    '/:id',
    {
      schema: {
        description: 'Update hotel by ID',
        tags: ['Hotels'],
        params: fromZodSchema(HotelParamsSchema),
        body: fromZodSchema(HotelSchema),
      },
    },
    async (request, reply) => {
      try {
        const { id } = HotelParamsSchema.parse(request.params);
        const data = HotelSchema.parse(request.body);

        const hotel = await fastify.em.findOne(Hotel, { id });

        if (!hotel) {
          return reply.status(404).send({ message: 'Hotel not found' });
        }

        fastify.em.assign(hotel, data);
        await fastify.em.persistAndFlush(hotel);

        return hotel;
      } catch (error) {
        handleRouteError(error, reply);
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete hotel by ID',
        tags: ['Hotels'],
        params: fromZodSchema(HotelParamsSchema),
      },
    },
    async (request, reply) => {
      try {
        const { id } = HotelParamsSchema.parse(request.params);
        const hotel = await fastify.em.findOne(Hotel, { id });

        if (!hotel) {
          return reply.status(404).send({ message: 'Hotel not found' });
        }

        await fastify.em.removeAndFlush(hotel);
        return reply.status(204).send();
      } catch (error) {
        handleRouteError(error, reply);
      }
    }
  );
};

export default hotelRoutes;
