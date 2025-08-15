import { FastifyPluginAsync } from 'fastify';
import { Booking } from '@/entities/booking.entity';
import { Accommodation } from '@/entities/accommodation.entity';
import {
  BookingInput,
  BookingSchema,
  BookingJsonSchema,
  BookingParamsSchema,
} from '../schemas/booking.schema';
import { PaginationQuerySchema, PaginationResponse } from '@schemas/pagination.schema';
import { BookingValidationService } from '@/services/booking/booking-validation.service';
import fromZodSchema from 'zod-to-json-schema';

const bookingRoutes: FastifyPluginAsync = async fastify => {
  fastify.get<{ Querystring: typeof PaginationQuerySchema._type }>(
    '/',
    {
      schema: {
        description: 'Get all bookings with pagination',
        tags: ['Bookings'],
        querystring: fromZodSchema(PaginationQuerySchema),
      },
    },
    async (request): Promise<PaginationResponse<Booking>> => {
      const { page, limit } = PaginationQuerySchema.parse(request.query);
      const offset = (page - 1) * limit;

      const [bookings, total] = await fastify.em.findAndCount(
        Booking,
        {},
        {
          limit,
          offset,
          populate: ['accommodation'],
        }
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: bookings,
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
        description: 'Get booking by ID',
        tags: ['Bookings'],
        params: fromZodSchema(BookingParamsSchema),
      },
    },
    async (request, reply) => {
      const { id } = BookingParamsSchema.parse(request.params);
      const booking = await fastify.em.findOne(Booking, { id }, { populate: ['accommodation'] });

      if (!booking) {
        return reply.status(404).send({ message: 'Booking not found' });
      }

      return booking;
    }
  );

  fastify.post<{ Body: BookingInput }>(
    '/',
    {
      schema: {
        description: 'Create a new booking',
        tags: ['Bookings'],
        body: BookingJsonSchema,
      },
    },
    async (request, reply) => {
      try {
        const data = BookingSchema.parse(request.body);
        const accommodation = await fastify.em.findOne(Accommodation, { id: data.accommodationId });

        if (!accommodation) {
          return reply.status(400).send({ message: 'Invalid accommodation ID' });
        }

        // Validate booking using the strategy pattern
        const validationService = new BookingValidationService(fastify.em);
        const accommodationType = await validationService.determineAccommodationType(
          data.accommodationId
        );
        const validation = await validationService.validateBooking(
          data.accommodationId,
          accommodationType,
          new Date(data.startDate),
          new Date(data.endDate)
        );

        if (!validation.allowed) {
          return reply.status(409).send({
            message: 'Booking conflict',
            reason: validation.reason,
          });
        }

        const booking = fastify.em.create(Booking, {
          ...data,
          accommodation,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        });

        await fastify.em.persistAndFlush(booking);
        return reply.status(201).send(booking);
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );

  fastify.put<{ Params: typeof BookingParamsSchema._type; Body: BookingInput }>(
    '/:id',
    {
      schema: {
        description: 'Update booking by ID',
        tags: ['Bookings'],
        params: fromZodSchema(BookingParamsSchema),
        body: BookingJsonSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = BookingParamsSchema.parse(request.params);
        const data = BookingSchema.parse(request.body);

        const booking = await fastify.em.findOne(Booking, { id }, { populate: ['accommodation'] });

        if (!booking) {
          return reply.status(404).send({ message: 'Booking not found' });
        }

        // Check if accommodation exists if updating accommodationId
        const accommodation = await fastify.em.findOne(Accommodation, { id: data.accommodationId });
        if (!accommodation) {
          return reply.status(400).send({ message: 'Invalid accommodation ID' });
        }

        // Validate booking update using the strategy pattern
        const validationService = new BookingValidationService(fastify.em);
        const accommodationType = await validationService.determineAccommodationType(
          data.accommodationId
        );
        const validation = await validationService.validateBooking(
          data.accommodationId,
          accommodationType,
          new Date(data.startDate),
          new Date(data.endDate),
          id // exclude current booking from overlap check
        );

        if (!validation.allowed) {
          return reply.status(409).send({
            message: 'Booking conflict',
            reason: validation.reason,
          });
        }

        fastify.em.assign(booking, {
          ...data,
          accommodation,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        });
        await fastify.em.persistAndFlush(booking);

        return booking;
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        description: 'Delete booking by ID',
        tags: ['Bookings'],
        params: fromZodSchema(BookingParamsSchema),
      },
    },
    async (request, reply) => {
      try {
        const { id } = BookingParamsSchema.parse(request.params);
        const booking = await fastify.em.findOne(Booking, { id });

        if (!booking) {
          return reply.status(404).send({ message: 'Booking not found' });
        }

        await fastify.em.removeAndFlush(booking);
        return reply.status(204).send();
      } catch (error) {
        return reply.status(400).send(error);
      }
    }
  );
};

export default bookingRoutes;
