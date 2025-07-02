module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.js', '**/*.spec.js'],
  collectCoverageFrom: ['**/*.{js,jsx}', '!**/components/**', '!**/assets/**']
};