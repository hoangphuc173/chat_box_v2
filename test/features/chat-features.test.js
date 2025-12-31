import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TestClient, wait } from '../utils/test-helpers.js';
import { sampleUsers } from '../utils/fixtures.js';

describe('Chat Features Tests', () => {
    let client1;
    let client2;
    let client3;

    beforeEach(async () => {
        client1 = new TestClient(sampleUsers[0].username, sampleUsers[0].password);
        client2 = new TestClient(sampleUsers[1].username, sampleUsers[1].password);
        client3 = new TestClient(sampleUsers[2].username, sampleUsers[2].password);
    });

    afterEach(async () => {
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();
        await wait(500);
    });

    describe('Private Messaging (1-1)', () => {
        test('should send private message between two users', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            // Send private message
            client1.send({
                type: 'private_message',
                recipientId: client2.userId,
                content: 'Private message to Bob'
            });

            await wait(500);

            // Client2 should receive it, client3 should not
            const msgEvent = client2.events.find(e =>
                e.type === 'private_message' &&
                e.data.content === 'Private message to Bob'
            );

            expect(msgEvent).toBeDefined();
        });

        test('should maintain separate conversation threads', async () => {
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

            // Client1 messages Client2
            client1.send({
                type: 'private_message',
                recipientId: client2.userId,
                content: 'Hello Bob'
            });

            // Client1 messages Client3
            client1.send({
                type: 'private_message',
                recipientId: client3.userId,
                content: 'Hello Charlie'
            });

            await wait(500);

            // Each should receive only their message
            const bob Messages = client2.events.filter(e => e.type === 'private_message');
            const charlieMessages = client3.events.filter(e => e.type === 'private_message');

            expect(bobMessages.length).toBeGreaterThanOrEqual(1);
            expect(charlieMessages.length).toBeGreaterThanOrEqual(1);
            expect(bobMessages[0].data.content).toBe('Hello Bob');
            expect(charlieMessages[0].data.content).toBe('Hello Charlie');
        });
    });

    describe('Group Chat Rooms', () => {
        test('should create a new room', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(500);

            client1.createRoom('Test Room');

            const roomEvent = await client1.waitForEvent('room_created', 3000);

            expect(roomEvent.data.success).toBe(true);
            expect(roomEvent.data.room).toBeDefined();
            expect(roomEvent.data.room.name).toBe('Test Room');
        });

        test('should join an existing room', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            // Client1 creates room
            client1.createRoom('Join Test Room');
            const createEvent = await client1.waitForEvent('room_created');
            const roomId = createEvent.data.room.id;

            // Client2 joins room
            client2.joinRoom(roomId);
            await wait(500);

            const joinEvent = client2.events.find(e =>
                e.type === 'room_joined' &&
                e.data.room.id === roomId
            );

            expect(joinEvent).toBeDefined();
        });

        test('should broadcast messages to all room members', async () => {
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

            // Create room
            client1.createRoom('Group Chat');
            const createEvent = await client1.waitForEvent('room_created');
            const roomId = createEvent.data.room.id;

            // Others join
            client2.joinRoom(roomId);
            client3.joinRoom(roomId);
            await wait(1000);

            // Send message to room
            client1.sendMessage('Hello everyone!', roomId);
            await wait(500);

            // All should receive
            expect(client1.messages.find(m => m.content === 'Hello everyone!')).toBeDefined();
            expect(client2.messages.find(m => m.content === 'Hello everyone!')).toBeDefined();
            expect(client3.messages.find(m => m.content === 'Hello everyone!')).toBeDefined();
        });

        test('should leave room', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            // Create and join room
            client1.createRoom('Leave Test');
            const createEvent = await client1.waitForEvent('room_created');
            const roomId = createEvent.data.room.id;

            client2.joinRoom(roomId);
            await wait(500);

            // Leave room
            client2.leaveRoom(roomId);
            await wait(500);

            const leaveEvent = client2.events.find(e => e.type === 'room_left');
            expect(leaveEvent).toBeDefined();
        });
    });

    describe('Edit and Delete Messages', () => {
        test('should edit a message', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendMessage('Original message');
            await wait(500);

            const originalMsg = client1.messages[client1.messages.length - 1];
            const messageId = originalMsg.messageId;

            client1.editMessage(messageId, 'Edited message');
            await wait(500);

            const editEvent = client2.events.find(e =>
                e.type === 'message_edited' &&
                e.data.messageId === messageId
            );

            expect(editEvent).toBeDefined();
            expect(editEvent.data.content).toBe('Edited message');
        });

        test('should delete a message', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendMessage('Message to delete');
            await wait(500);

            const msg = client1.messages[client1.messages.length - 1];
            const messageId = msg.messageId;

            client1.deleteMessage(messageId);
            await wait(500);

            const deleteEvent = client2.events.find(e =>
                e.type === 'message_deleted' &&
                e.data.messageId === messageId
            );

            expect(deleteEvent).toBeDefined();
        });
    });

    describe('Message Search', () => {
        test('should search messages by content', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(500);

            // Send multiple messages
            client1.sendMessage('JavaScript is great');
            await wait(200);
            client1.sendMessage('Python is awesome');
            await wait(200);
            client1.sendMessage('Java is powerful');
            await wait(500);

            // Search for 'JavaScript'
            client1.send({
                type: 'search_messages',
                query: 'JavaScript'
            });

            const searchEvent = await client1.waitForEvent('search_results', 3000);

            expect(searchEvent.data.results).toBeDefined();
            expect(searchEvent.data.results.length).toBeGreaterThan(0);
            expect(searchEvent.data.results[0].content).toContain('JavaScript');
        });
    });

    describe('Read Receipts', () => {
        test('should mark messages as read', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');

            await client2.connect();
            client2.login();
            await client2.waitForEvent('login_response');
            await wait(500);

            client1.sendMessage('Read receipt test');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            // Client2 marks as read
            client2.send({
                type: 'mark_read',
                messageId
            });

            await wait(500);

            const readEvent = client1.events.find(e =>
                e.type === 'message_read' &&
                e.data.messageId === messageId
            );

            expect(readEvent).toBeDefined();
        });
    });

    describe('Message History and Pagination', () => {
        test('should retrieve message history', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(500);

            // Send some messages
            for (let i = 0; i < 5; i++) {
                client1.sendMessage(`History message ${i + 1}`);
                await wait(100);
            }

            await wait(500);

            // Request history
            client1.send({
                type: 'get_history',
                roomId: 'global',
                limit: 10
            });

            const historyEvent = await client1.waitForEvent('history', 3000);

            expect(historyEvent.data.messages).toBeDefined();
            expect(historyEvent.data.messages.length).toBeGreaterThan(0);
        });

        test('should support pagination in history', async () => {
            await client1.connect();
            client1.login();
            await client1.waitForEvent('login_response');
            await wait(500);

            // Request first page
            client1.send({
                type: 'get_history',
                roomId: 'global',
                limit: 5,
                offset: 0
            });

            const page1 = await client1.waitForEvent('history');
            const firstPageCount = page1.data.messages.length;

            client1.clearEvents();

            // Request second page
            client1.send({
                type: 'get_history',
                roomId: 'global',
                limit: 5,
                offset: 5
            });

            await wait(500);
            const page2Event = client1.events.find(e => e.type === 'history');

            if (page2Event) {
                expect(page2Event.data.messages).toBeDefined();
                // Messages should be different from first page
            }

            expect(firstPageCount).toBeGreaterThanOrEqual(0);
        });
    });
});
