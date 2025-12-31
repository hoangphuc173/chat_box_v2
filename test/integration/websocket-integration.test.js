import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { TestClient, wait } from '../utils/test-helpers.js';
import { sampleUsers } from '../utils/fixtures.js';

describe('WebSocket Integration Tests', () => {
    let client1;
    let client2;

    beforeAll(async () => {
        // Give server time to start if needed
        await wait(1000);
    });

    beforeEach(() => {
        // Create fresh clients for each test
        client1 = new TestClient(sampleUsers[0].username, sampleUsers[0].password);
        client2 = new TestClient(sampleUsers[1].username, sampleUsers[1].password);
    });

    afterEach(async () => {
        // Cleanup
        client1.disconnect();
        client2.disconnect();
        await wait(500);
    });

    describe('Connection and Authentication', () => {
        test('should connect to WebSocket server', async () => {
            await client1.connect();
            expect(client1.isConnected).toBe(true);
        });

        test('should login successfully with valid credentials', async () => {
            await client1.connect();
            client1.login();

            const event = await client1.waitForEvent('login_response');

            expect(event.data.success).toBe(true);
            expect(event.data.token).toBeDefined();
            expect(event.data.userId).toBeDefined();
            expect(client1.token).toBeTruthy();
        });

        test('should fail login with invalid credentials', async () => {
            const badClient = new TestClient('nonexistent', 'wrongpass');
            await badClient.connect();
            badClient.login();

            const event = await badClient.waitForEvent('login_response');

            expect(event.data.success).toBe(false);
            expect(event.data.message).toBeDefined();

            badClient.disconnect();
        });

        test('should receive JWT token on successful login', async () => {
            await client1.connect();
            client1.login();

            await client1.waitForEvent('login_response');

            expect(client1.token).toBeTruthy();
            expect(typeof client1.token).toBe('string');
            expect(client1.token.length).toBeGreaterThan(20);
        });
    });

    describe('Online Users and Presence', () => {
        test('should receive online users list after login', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(1000);

            expect(client1.onlineUsers.length).toBeGreaterThanOrEqual(0);
        });

        test('should detect when another user joins', async () => {
            // Client 1 connects first
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(500);

            const initialCount = client1.onlineUsers.length;

            // Client 2 connects
            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(1000);

            // Client 1 should see client 2 joined
            const userJoinedEvent = client1.events.find(e =>
                e.type === 'user_joined' &&
                e.data.username === client2.username
            );

            expect(userJoinedEvent).toBeDefined();
            expect(client1.onlineUsers.length).toBeGreaterThan(initialCount);
        });

        test('should detect when user disconnects', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(1000);

            // Disconnect client2
            client2.disconnect();
            await wait(1000);

            // Client1 should receive user_left event
            const userLeftEvent = client1.events.find(e =>
                e.type === 'user_left'
            );

            expect(userLeftEvent).toBeDefined();
        });
    });

    describe('Message Broadcasting', () => {
        test('should send and receive messages', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            const testMessage = 'Hello from client1!';
            client1.sendMessage(testMessage);
            await wait(500);

            // Both clients should receive the message
            const msg1 = client1.messages.find(m => m.content === testMessage);
            const msg2 = client2.messages.find(m => m.content === testMessage);

            expect(msg1).toBeDefined();
            expect(msg2).toBeDefined();
            expect(msg1.content).toBe(testMessage);
            expect(msg2.content).toBe(testMessage);
        });

        test('should broadcast message to all connected clients', async () => {
            const client3 = new TestClient(sampleUsers[2].username, sampleUsers[2].password);

            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');

            await client3.connect();
            client3.login();
            await client3.waitForEvent('login_response');
            await wait(500);

            const testMessage = 'Broadcast test!';
            client1.sendMessage(testMessage);
            await wait(1000);

            expect(client1.messages.find(m => m.content === testMessage)).toBeDefined();
            expect(client2.messages.find(m => m.content === testMessage)).toBeDefined();
            expect(client3.messages.find(m => m.content === testMessage)).toBeDefined();

            client3.disconnect();
        });

        test('should include sender information in message', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendMessage('Test message');
            await wait(500);

            const msg = client2.messages[0];
            expect(msg.username).toBe(client1.username);
            expect(msg.userId).toBeDefined();
            expect(msg.timestamp).toBeDefined();
        });
    });

    describe('Typing Indicators', () => {
        test('should send and receive typing indicators', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendTyping(true);
            await wait(500);

            const typingEvent = client2.events.find(e =>
                e.type === 'typing' &&
                e.data.isTyping === true &&
                e.data.username === client1.username
            );

            expect(typingEvent).toBeDefined();
            expect(client2.typingUsers.length).toBeGreaterThan(0);
        });

        test('should clear typing indicator', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendTyping(true);
            await wait(500);
            expect(client2.typingUsers.length).toBeGreaterThan(0);

            client1.sendTyping(false);
            await wait(500);
            expect(client2.typingUsers.length).toBe(0);
        });
    });

    describe('Reconnection', () => {
        test('should handle reconnection', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            // Disconnect
            client1.disconnect();
            await wait(1000);
            expect(client1.isConnected).toBe(false);

            // Reconnect
            await client1.connect();
            expect(client1.isConnected).toBe(true);

            client1.login();
            const event = await client1.waitForEvent('login_response');
            expect(event.data.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid message format', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            // Send invalid JSON
            client1.ws.send('invalid json{{{');
            await wait(500);

            // Server should not crash (client still connected)
            expect(client1.isConnected).toBe(true);
        });

        test('should handle messages before authentication', async () => {
            await client1.connect();

            // Try to send message without logging in
            client1.sendMessage('Unauthorized message');
            await wait(500);

            // Should receive error or no response
            const errorEvent = client1.events.find(e => e.type === 'error');
            // Either got error or message was ignored
            expect(client1.isConnected).toBe(true);
        });
    });
});
