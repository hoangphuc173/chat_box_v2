/**
 * Jest Setup File
 * Runs before all tests
 */

// Increase timeout for WebSocket tests
jest.setTimeout(30000);

// Global test utilities
global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Console cleanup - suppress expected errors/warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('componentWillReceiveProps')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// Custom matchers
expect.extend({
    toBeWebSocketMessage(received, expectedType) {
        const pass =
            typeof received === 'object' &&
            received !== null &&
            received.type === expectedType;

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be WebSocket message of type ${expectedType}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be WebSocket message of type ${expectedType}`,
                pass: false,
            };
        }
    },

    toHaveReceivedEventWithin(client, eventType, timeoutMs) {
        const event = client.events.find(e =>
            e.type === eventType &&
            (Date.now() - e.time) < timeoutMs
        );

        const pass = !!event;

        if (pass) {
            return {
                message: () => `expected client not to receive ${eventType} within ${timeoutMs}ms`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected client to receive ${eventType} within ${timeoutMs}ms, but received: ${client.events.map(e => e.type).join(', ')}`,
                pass: false,
            };
        }
    }
});
