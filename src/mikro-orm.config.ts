import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Accommodation } from './entities/accommodation.entity';
import { Booking } from './entities/booking.entity';
import { Hotel } from './entities/hotel.entity';
import { Apartment } from './entities/apartment.entity';
import { env, isDevelopment } from './config/env.config';

const mikroOrmConfig: Options<PostgreSqlDriver> = {
  entities: [Accommodation, Booking, Hotel, Apartment],
  dbName: env.DB_NAME,
  type: 'postgresql',
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: './src/migrations',
    disableForeignKeys: false,
  },
  debug: isDevelopment(),
  allowGlobalContext: isDevelopment(),
};

export default mikroOrmConfig;
