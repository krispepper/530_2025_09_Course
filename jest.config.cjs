/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",

  testMatch: ["<rootDir>/tests/**/*.test.js", "<rootDir>/__tests__/**/*.test.js"],

  testPathIgnorePatterns: [
    "<rootDir>/public/tests/",
  ],

  modulePathIgnorePatterns: [
    "<rootDir>/adem-hello-world-app/",
  ],
};
