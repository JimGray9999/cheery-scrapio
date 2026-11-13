module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['controllers/**/*.js', 'services/**/*.js', '!**/node_modules/**'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  testTimeout: 10000,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 78,
      statements: 78,
    },
  },
};
