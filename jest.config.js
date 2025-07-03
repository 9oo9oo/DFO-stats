module.exports = {
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.js', '**/*.spec.js'],
  collectCoverageFrom: [
    '**/*.{js,jsx}', 
    '!**/components/**', 
    '!**/assets/**', 
    '!**/config/**', 
    '!server.js', 
    '!**/coverage/**'],
    reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "test-results",
      outputName: "junit.xml"
    }]
  ]
};