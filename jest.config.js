module.exports = {
  testEnvironment: 'node',

  roots: [
    '<rootDir>/src',         // backend
    // '<rootDir>/client/src',  // frontend
  ],

  moduleFileExtensions: ['js', 'json', 'vue'],

  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$':  'babel-jest',
  },

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.spec.js',
    '<rootDir>/src/**/*.spec.js',
    // '<rootDir>/client/src/**/__tests__/**/*.spec.js',
    // '<rootDir>/client/src/**/*.spec.js',
  ],

  // moduleNameMapper: {
  //   '^@/(.*)$':         '<rootDir>/src/$1',
  //   '^@client/(.*)$':   '<rootDir>/client/src/$1',
  // },

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js',
    // 'client/src/**/*.js',
    // 'client/src/**/*.vue',
    // '!client/src/main.js',
    // '!client/src/config/*.js',
    // '!client/src/router/*.js',
  ],

  reporters: [
    "default",
    ["jest-junit", {
      outputDirectory: "test-results",
      outputName: "junit.xml"
    }]
  ]
};