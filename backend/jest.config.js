module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/whitebox-tests'],
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/controllers/categoryController.js',
    'src/controllers/productController.js',
    'src/middlewares/authMiddleware.js'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
