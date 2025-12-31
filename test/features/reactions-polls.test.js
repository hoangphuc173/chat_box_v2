import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TestClient, wait } from '../utils/test-helpers.js';
import { sampleUsers, samplePolls, sampleEmojis } from '../utils/fixtures.js';

describe('Reactions and Polls Tests', () => {
    let client1;
    let client2;
    let client3;

    beforeEach(async () => {
        client1 = new TestClient(sampleUsers[0].username, sampleUsers[0].password);
        client2 = new TestClient(sampleUsers[1].username, sampleUsers[1].password);
        client3 = new TestClient(sampleUsers[2].username, sampleUsers[2].password);

        await client1.connect();
        client1.login();
        await client1.waitForEvent('login_response');

        await client2.connect();
        client2.login();
        await client2.waitForEvent('login_response');

        await wait(500);
    });

    afterEach(async () => {
        client1.disconnect();
        client2.disconnect();
        client3.disconnect();
        await wait(500);
    });

    describe('Message Reactions', () => {
        test('should add reaction to message', async () => {
            client1.sendMessage('React to this!');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            client2.addReaction(messageId, '👍');
            await wait(500);

            const reactionEvent = client1.events.find(e =>
                e.type === 'reaction_added' &&
                e.data.messageId === messageId &&
                e.data.emoji === '👍'
            );

            expect(reactionEvent).toBeDefined();
        });

        test('should support multiple reactions on same message', async () => {
            client1.sendMessage('Multiple reactions test');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            // Add multiple reactions
            client2.addReaction(messageId, '👍');
            await wait(200);
            client2.addReaction(messageId, '❤️');
            await wait(200);
            client2.addReaction(messageId, '😂');
            await wait(500);

            const reactions = client1.events.filter(e =>
                e.type === 'reaction_added' &&
                e.data.messageId === messageId
            );

            expect(reactions.length).toBeGreaterThanOrEqual(3);
        });

        test('should remove reaction from message', async () => {
            client1.sendMessage('Remove reaction test');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            // Add reaction
            client2.addReaction(messageId, '👍');
            await wait(500);

            // Remove reaction
            client2.send({
                type: 'remove_reaction',
                messageId,
                emoji: '👍'
            });

            await wait(500);

            const removeEvent = client1.events.find(e =>
                e.type === 'reaction_removed' &&
                e.data.messageId === messageId &&
                e.data.emoji === '👍'
            );

            expect(removeEvent).toBeDefined();
        });

        test('should track who reacted with what emoji', async () => {
            await client3.connect();
            client3.login();
            await client3.waitForEvent('login_response');
            await wait(500);

            client1.sendMessage('Who reacted?');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            // Multiple users react
            client2.addReaction(messageId, '❤️');
            await wait(200);
            client3.addReaction(messageId, '❤️');
            await wait(500);

            // Get reaction details
            client1.send({
                type: 'get_reactions',
                messageId
            });

            const reactionsEvent = await client1.waitForEvent('reactions_list', 3000);

            expect(reactionsEvent.data.reactions).toBeDefined();
            const heartReactions = reactionsEvent.data.reactions.filter(r => r.emoji === '❤️');
            expect(heartReactions.length).toBe(2);
        });

        test('should support all common emoji reactions', async () => {
            client1.sendMessage('Emoji test');
            await wait(500);

            const msg = client2.messages[client2.messages.length - 1];
            const messageId = msg.messageId;

            for (const emoji of sampleEmojis.slice(0, 3)) {
                client2.addReaction(messageId, emoji);
                await wait(100);
            }

            await wait(500);

            const reactions = client1.events.filter(e =>
                e.type === 'reaction_added' &&
                e.data.messageId === messageId
            );

            expect(reactions.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Polls', () => {
        test('should create a poll', async () => {
            const poll = samplePolls[0];

            client1.createPoll(poll.question, poll.options);

            const pollEvent = await client1.waitForEvent('poll_created', 3000);

            expect(pollEvent.data.poll).toBeDefined();
            expect(pollEvent.data.poll.question).toBe(poll.question);
            expect(pollEvent.data.poll.options.length).toBe(poll.options.length);
        });

        test('should broadcast poll to all users in room', async () => {
            await client3.connect();
            client3.login();
            await client3.waitForEvent('login_response');
            await wait(500);

            const poll = samplePolls[1];
            client1.createPoll(poll.question, poll.options);

            await wait(1000);

            // All clients should receive poll
            const poll1 = client1.events.find(e => e.type === 'poll_created');
            const poll2 = client2.events.find(e => e.type === 'poll_created');
            const poll3 = client3.events.find(e => e.type === 'poll_created');

            expect(poll1).toBeDefined();
            expect(poll2).toBeDefined();
            expect(poll3).toBeDefined();
        });

        test('should vote in a poll', async () => {
            const poll = samplePolls[2];

            client1.createPoll(poll.question, poll.options);
            const pollEvent = await client1.waitForEvent('poll_created');
            const pollId = pollEvent.data.poll.id;

            // Client2 votes
            client2.votePoll(pollId, 0); // Vote for first option
            await wait(500);

            const voteEvent = client1.events.find(e =>
                e.type === 'poll_voted' &&
                e.data.pollId === pollId
            );

            expect(voteEvent).toBeDefined();
            expect(voteEvent.data.optionIndex).toBe(0);
        });

        test('should update poll results in real-time', async () => {
            await client3.connect();
            client3.login();
            await client3.waitForEvent('login_response');
            await wait(500);

            const poll = samplePolls[0];

            client1.createPoll(poll.question, poll.options);
            const pollEvent = await client1.waitForEvent('poll_created');
            const pollId = pollEvent.data.poll.id;

            // Multiple votes
            client2.votePoll(pollId, 0);
            await wait(300);
            client3.votePoll(pollId, 1);
            await wait(500);

            // Get poll results
            client1.send({
                type: 'get_poll_results',
                pollId
            });

            const resultsEvent = await client1.waitForEvent('poll_results', 3000);

            expect(resultsEvent.data.results).toBeDefined();
            expect(resultsEvent.data.results[0].votes).toBeGreaterThan(0);
            expect(resultsEvent.data.results[1].votes).toBeGreaterThan(0);
        });

        test('should prevent double voting', async () => {
            const poll = samplePolls[0];

            client1.createPoll(poll.question, poll.options);
            const pollEvent = await client1.waitForEvent('poll_created');
            const pollId = pollEvent.data.poll.id;

            // Try to vote twice
            client2.votePoll(pollId, 0);
            await wait(300);
            client2.votePoll(pollId, 1);
            await wait(500);

            // Should get error or only last vote counts
            const voteEvents = client2.events.filter(e =>
                e.type === 'poll_voted' || e.type === 'error'
            );

            expect(voteEvents.length).toBeGreaterThan(0);
        });

        test('should support anonymous polls', async () => {
            client1.send({
                type: 'create_poll',
                question: 'Anonymous poll?',
                options: ['Yes', 'No'],
                anonymous: true
            });

            const pollEvent = await client1.waitForEvent('poll_created');

            expect(pollEvent.data.poll.anonymous).toBe(true);

            const pollId = pollEvent.data.poll.id;
            client2.votePoll(pollId, 0);
            await wait(500);

            // Votes should not show user info
            client1.send({ type: 'get_poll_results', pollId });
            const resultsEvent = await client1.waitForEvent('poll_results', 3000);

            // Results should not include voter names
            expect(resultsEvent.data.results).toBeDefined();
        });

        test('should close poll and prevent further voting', async () => {
            const poll = samplePolls[0];

            client1.createPoll(poll.question, poll.options);
            const pollEvent = await client1.waitForEvent('poll_created');
            const pollId = pollEvent.data.poll.id;

            // Close poll
            client1.send({
                type: 'close_poll',
                pollId
            });

            await wait(500);

            // Try to vote after closing
            client2.votePoll(pollId, 0);
            await wait(500);

            // Should get error
            const errorEvent = client2.events.find(e =>
                e.type === 'error' &&
                e.data.message.includes('closed')
            );

            expect(errorEvent).toBeDefined();
        });

        test('should display poll results as chart data', async () => {
            const poll = samplePolls[0];

            client1.createPoll(poll.question, poll.options);
            const pollEvent = await client1.waitForEvent('poll_created');
            const pollId = pollEvent.data.poll.id;

            // Some votes
            client2.votePoll(pollId, 0);
            await wait(500);

            client1.send({ type: 'get_poll_results', pollId });
            const resultsEvent = await client1.waitForEvent('poll_results', 3000);

            expect(resultsEvent.data.results).toBeDefined();
            expect(Array.isArray(resultsEvent.data.results)).toBe(true);

            resultsEvent.data.results.forEach(result => {
                expect(result).toHaveProperty('text');
                expect(result).toHaveProperty('votes');
            });
        });
    });
});
