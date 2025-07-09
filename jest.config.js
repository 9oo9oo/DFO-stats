module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: [
    '<rootDir>/src',         // backend
    // '<rootDir>/client/src',  // frontend
  ],

  moduleFileExtensions: ['ts', 'js', 'json', 'vue'],

  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // '^.+\\.vue$': '@vue/vue3-jest',
    // '^.+\\.js$':  'babel-jest',
  },

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    // '<rootDir>/client/src/**/__tests__/**/*.spec.js',
  ],

  // moduleNameMapper: {
  //   '^@/(.*)$':         '<rootDir>/src/$1',
  //   '^@client/(.*)$':   '<rootDir>/client/src/$1',
  // },

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
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