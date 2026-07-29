module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
