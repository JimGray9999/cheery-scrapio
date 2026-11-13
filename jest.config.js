module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    'config/**/*.js',
    '!**/node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 63,
      functions: 63,
      lines: 65,
      statements: 65,
    },
  },
};
