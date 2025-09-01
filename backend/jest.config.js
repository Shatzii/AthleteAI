module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/setupTests.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!supertest)/'
  ]
};
