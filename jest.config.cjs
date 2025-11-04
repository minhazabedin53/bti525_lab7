module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  verbose: true,
  transform: {},
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/index.js",
    "!src/**/__tests__/**",
  ],
};
