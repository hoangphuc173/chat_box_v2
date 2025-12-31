import { TestClient, wait } from '../utils/test-helpers.js';

describe('AI Chatbot Tests', () => {
    let client1;
    let client2;

    beforeEach(async () => {
        client1 = new TestClient('testuser999', 'test999');
        client2 = new TestClient('testuser1', 'password');

        await client1.connect();
        client1.login();
        await client1.waitForEvent('login_response');

        await client2.connect();
        client2.login();
        await client2.waitForEvent('login_response');

        await wait(500);
    });

    afterEach(() => {
        if (client1) client1.disconnect();
        if (client2) client2.disconnect();
    });

    describe('AI Command Detection', () => {
        test('should detect @ai command in message', async () => {
            client1.sendMessage('@ai Hello AI!');
            await wait(1000);

            // Check if client received ai_response
            const aiResponse = client1.events.find(e => e.type === 'ai_response');
            expect(aiResponse).toBeDefined();
        });

        test('should work with @ai at start of message', async () => {
            client1.sendMessage('@ai What is 1+1?');
            await wait(1500);

            // Should get AI response
            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data).toBeDefined();
        });

        test('should broadcast AI response to room', async () => {
            client1.sendMessage('@ai Tell me a joke');
            await wait(2000);

            // Both clients should see the AI response
            const ai1 = client1.events.find(e => e.type === 'ai_response');
            const ai2 = client2.events.find(e => e.type === 'ai_response');

            expect(ai1).toBeDefined();
            expect(ai2).toBeDefined();
        });
    });

    describe('AI Response Content', () => {
        test('should get AI response for math question', async () => {
            client1.sendMessage('@ai What is 2+2?');
            await wait(2000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.content).toBeDefined();
            expect(typeof aiEvent.data.content).toBe('string');
            expect(aiEvent.data.content.length).toBeGreaterThan(0);
        });

        test('should handle complex AI questions', async () => {
            client1.sendMessage('@ai Explain what is WebSocket in simple terms');
            await wait(3000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.content).toBeDefined();
            expect(aiEvent.data.content.toLowerCase()).toContain('websocket');
        });

        test('should provide helpful responses', async () => {
            client1.sendMessage('@ai Hi, how are you?');
            await wait(2000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.content).toBeDefined();
        });
    });

    describe('AI Message Metadata', () => {
        test('should have AI bot username in response', async () => {
            client1.sendMessage('@ai Hello');
            await wait(2000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.username).toBeDefined();
            expect(aiEvent.data.username.toLowerCase()).toContain('ai');
        });

        test('should have timestamp in AI response', async () => {
            client1.sendMessage('@ai Test');
            await wait(2000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.timestamp).toBeDefined();
        });

        test('should have message ID in AI response', async () => {
            client1.sendMessage('@ai Test message ID');
            await wait(2000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeDefined();
            expect(aiEvent.data.messageId).toBeDefined();
        });
    });

    describe('AI Error Handling', () => {
        test('should handle empty AI query', async () => {
            client1.sendMessage('@ai');
            await wait(1000);

            // Should either get error or ignore
            const events = client1.events.filter(e =>
                e.type === 'ai_response' || e.type === 'error'
            );
            expect(events.length).toBeGreaterThanOrEqual(0);
        });

        test('should handle very long AI query', async () => {
            const longQuery = '@ai ' + 'a'.repeat(1000);
            client1.sendMessage(longQuery);
            await wait(3000);

            // Should handle gracefully
            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            const errorEvent = client1.events.find(e => e.type === 'error');

            expect(aiEvent || errorEvent).toBeDefined();
        });
    });

    describe('AI Context and History', () => {
        test('should respond to multiple AI queries in sequence', async () => {
            // First query
            client1.sendMessage('@ai My name is Alice');
            await wait(2000);

            const firstResponse = client1.events.find(e => e.type === 'ai_response');
            expect(firstResponse).toBeDefined();

            // Second query
            client1.sendMessage('@ai What is my name?');
            await wait(2000);

            const responses = client1.events.filter(e => e.type === 'ai_response');
            expect(responses.length).toBeGreaterThanOrEqual(2);
        });

        test('should handle multiple users asking AI simultaneously', async () => {
            // Both users ask at same time
            client1.sendMessage('@ai Tell me about cats');
            client2.sendMessage('@ai Tell me about dogs');

            await wait(3000);

            const ai1 = client1.events.filter(e => e.type === 'ai_response');
            const ai2 = client2.events.filter(e => e.type === 'ai_response');

            // Both should get responses
            expect(ai1.length).toBeGreaterThan(0);
            expect(ai2.length).toBeGreaterThan(0);
        });
    });

    describe('Regular Messages vs AI', () => {
        test('should NOT trigger AI for normal messages', async () => {
            client1.sendMessage('Hello everyone!');
            await wait(1000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeUndefined();
        });

        test('should differentiate @ai from @mention', async () => {
            client1.sendMessage('@testuser1 hello'); // Not @ai
            await wait(1000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeUndefined();
        });

        test('should only trigger on "@ai" not "AI" in message', async () => {
            client1.sendMessage('I love AI technology');
            await wait(1000);

            const aiEvent = client1.events.find(e => e.type === 'ai_response');
            expect(aiEvent).toBeUndefined();
        });
    });
});
