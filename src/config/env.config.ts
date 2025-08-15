import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment schema with validation and defaults
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server Configuration
  PORT: z.coerce.number().int().min(1).max(65535).default(8006),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  API_RATE_LIMIT: z.coerce.number().int().min(1).default(100),

  // Database Configuration
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_NAME: z.string().min(1).default('accommodation_booking'),
  DB_USER: z.string().min(1).default('postgres'),
  DB_PASSWORD: z.string().min(1).default('postgres'),

  // SSL/Security Configuration (optional)
  DB_SSL: z.coerce.boolean().default(false),

  // API Configuration
  API_PREFIX: z.string().default('/api/v1'),
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  CORS_ORIGIN: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

// Validate environment variables
const parseEnv = (): EnvConfig => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });

      console.error('❌ Environment validation failed:');
      missingVars.forEach(err => console.error(`  - ${err}`));

      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Using default values for development...');
        // Return with defaults for development
        return envSchema.parse({});
      }
    }
    throw error;
  }
};

// Export validated environment configuration
export const env = parseEnv();

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

// Database URL builder
export const getDatabaseUrl = () => {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = env;
  return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

// Server URL builder
export const getServerUrl = () => {
  const protocol = env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = env.NODE_ENV === 'production' ? env.HOST : 'localhost';
  return `${protocol}://${host}:${env.PORT}`;
};

// Log current configuration (safe for production)
export const logConfiguration = () => {
  console.log('🔧 Configuration loaded:');
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Server: ${getServerUrl()}`);
  console.log(`  Database: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  console.log(`  Log Level: ${env.LOG_LEVEL}`);
  console.log(`  Swagger: ${env.SWAGGER_ENABLED ? 'enabled' : 'disabled'}`);
};
