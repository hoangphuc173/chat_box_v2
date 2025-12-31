/** @type {import('jest').Config} */
export default {
    // Test environment
    testEnvironment: 'node',

    // Root directory for tests
    roots: ['<rootDir>'],

    // Test file patterns
    testMatch: [
        '**/integration/**/*.test.js',
        '**/features/**/*.test.js',
        '**/utils/**/*.test.js'
    ],

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/utils/jest.setup.js'],

    // Coverage configuration
    collectCoverageFrom: [
        'integration/**/*.js',
        'features/**/*.js',
        'utils/**/*.js',
        '!**/*.test.js',
        '!**/node_modules/**'
    ],

    coverageDirectory: 'coverage',

    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },

    // Timeout for async tests (WebSocket tests might take longer)
    testTimeout: 30000,

    // Force exit after all tests complete
    forceExit: true,

    // Detect open handles (useful for WebSocket cleanup)
    detectOpenHandles: true,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Transform files (for ES modules)
    transform: {},

    // Module file extensions
    moduleFileExtensions: ['js', 'json', 'node']
};
