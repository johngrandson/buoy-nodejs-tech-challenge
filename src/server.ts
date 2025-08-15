import fastify from 'fastify';
import { MikroORM } from '@mikro-orm/core';
import mikroOrmConfig from './mikro-orm.config';
import bookingRoutes from './routes/booking.routes';
import hotelRoutes from './routes/hotel.routes';
import apartmentRoutes from './routes/apartment.routes';
import nextAvailableDateRoutes from './routes/next-available-date.routes';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import { env, getServerUrl, logConfiguration } from './config/env.config';

const server = fastify({
  logger: {
    level: env.LOG_LEVEL,
  },
});

async function registerSwagger() {
  if (!env.SWAGGER_ENABLED) {
    return;
  }

  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Accommodation Booking API',
        description: 'A comprehensive API for managing accommodations and bookings',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@accommodation-booking.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      host: getServerUrl().replace(/^https?:\/\//, ''),
      schemes: [env.NODE_ENV === 'production' ? 'https' : 'http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Bookings', description: 'Booking management endpoints' },
        { name: 'Hotels', description: 'Hotel management endpoints' },
        { name: 'Apartments', description: 'Apartment management endpoints' },
        { name: 'Accommodations', description: 'Accommodation availability endpoints' },
      ],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: header => header,
  });
}

const start = async () => {
  try {
    // Log configuration for debugging
    logConfiguration();

    // await 1 second before starting the server
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Register CORS to allow access from any origin
    await server.register(cors, {
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    await registerSwagger();

    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();

    server.decorate('orm', orm);
    server.decorate('em', orm.em.fork());

    // Register routes with API prefix if configured
    const prefix = env.API_PREFIX === '/api/v1' ? '' : env.API_PREFIX;

    server.register(bookingRoutes, { prefix: `${prefix}/bookings` });
    server.register(hotelRoutes, { prefix: `${prefix}/hotels` });
    server.register(apartmentRoutes, { prefix: `${prefix}/apartments` });
    server.register(nextAvailableDateRoutes, { prefix: `${prefix}/accommodations` });

    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 Server ready at ${getServerUrl()}`);
    if (env.SWAGGER_ENABLED) {
      console.log(`📚 API Documentation: ${getServerUrl()}/documentation`);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
