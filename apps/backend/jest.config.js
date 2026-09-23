/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Map to built dist (the `test` turbo task depends on ^build, so these exist).
  moduleNameMapper: {
    '^@photography/types$': '<rootDir>/../../../packages/types/dist/index.js',
    '^@photography/utils$': '<rootDir>/../../../packages/utils/dist/index.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
