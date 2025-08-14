module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1, // Run tests sequentially to ensure database isolation
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@entities/(.*)$': '<rootDir>/src/entities/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@schemas/(.*)$': '<rootDir>/src/schemas/$1',
    '^@migrations/(.*)$': '<rootDir>/src/migrations/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
};
