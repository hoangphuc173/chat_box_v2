/**
 * Test Fixtures - Sample data for testing
 */

export const sampleUsers = [
    {
        username: 'alice_test',
        password: 'password123',
        email: 'alice@test.com'
    },
    {
        username: 'bob_test',
        password: 'password456',
        email: 'bob@test.com'
    },
    {
        username: 'charlie_test',
        password: 'password789',
        email: 'charlie@test.com'
    }
];

export const sampleMessages = [
    'Hello everyone! 👋',
    'How are you doing today?',
    'This is a test message',
    'Let\'s test the chat features!',
    '🎉 Celebration time!',
    '@alice What do you think?',
    'Check this out!'
];

export const sampleRooms = [
    {
        name: 'Test Room 1',
        description: 'First test room',
        isPrivate: false
    },
    {
        name: 'Test Room 2',
        description: 'Second test room',
        isPrivate: false
    },
    {
        name: 'Private Room',
        description: 'Private test room',
        isPrivate: true
    }
];

export const samplePolls = [
    {
        question: 'What is your favorite programming language?',
        options: ['JavaScript', 'Python', 'Java', 'C++', 'Go']
    },
    {
        question: 'When should we have the next meeting?',
        options: ['Monday 9AM', 'Tuesday 2PM', 'Wednesday 10AM', 'Friday 3PM']
    },
    {
        question: 'Do you like this feature?',
        options: ['Yes', 'No', 'Maybe']
    }
];

export const sampleEmojis = ['👍', '❤️', '😂', '🔥', '✨', '🎉', '👏', '😊'];

export const sampleFileMetadata = [
    {
        filename: 'test-document.pdf',
        size: 1024 * 500, // 500KB
        type: 'application/pdf'
    },
    {
        filename: 'test-image.png',
        size: 1024 * 200, // 200KB
        type: 'image/png'
    },
    {
        filename: 'test-video.mp4',
        size: 1024 * 1024 * 5, // 5MB
        type: 'video/mp4'
    }
];

/**
 * Mock WebSocket server responses
 */
export const mockResponses = {
    loginSuccess: (userId, username, token) => ({
        type: 'login_response',
        success: true,
        userId,
        username,
        token,
        message: 'Login successful'
    }),

    loginFailure: (message = 'Invalid credentials') => ({
        type: 'login_response',
        success: false,
        message
    }),

    onlineUsers: (users) => ({
        type: 'online_users',
        users: users.map((u, i) => ({
            userId: u.userId || `user_${i}`,
            username: u.username,
            status: u.status || 'online'
        }))
    }),

    chatMessage: (userId, username, content, roomId = 'global') => ({
        type: 'chat',
        messageId: `msg_${Date.now()}`,
        userId,
        username,
        content,
        roomId,
        timestamp: Date.now()
    }),

    typing: (userId, username, isTyping) => ({
        type: 'typing',
        userId,
        username,
        isTyping
    }),

    roomCreated: (roomId, roomName, creatorId) => ({
        type: 'room_created',
        success: true,
        room: {
            id: roomId,
            name: roomName,
            creatorId,
            members: [creatorId],
            createdAt: Date.now()
        }
    }),

    pollCreated: (pollId, question, options, creatorId) => ({
        type: 'poll_created',
        poll: {
            id: pollId,
            question,
            options: options.map((opt, i) => ({
                index: i,
                text: opt,
                votes: 0
            })),
            creatorId,
            createdAt: Date.now()
        }
    }),

    reaction: (messageId, userId, emoji) => ({
        type: 'reaction_added',
        messageId,
        userId,
        emoji,
        timestamp: Date.now()
    }),

    messageEdited: (messageId, newContent) => ({
        type: 'message_edited',
        messageId,
        content: newContent,
        editedAt: Date.now()
    }),

    messageDeleted: (messageId) => ({
        type: 'message_deleted',
        messageId,
        deletedAt: Date.now()
    }),

    error: (message, code = 'ERROR') => ({
        type: 'error',
        code,
        message
    })
};

/**
 * Generate test data
 */
export function generateTestMessages(count = 10, userId = 'test_user') {
    return Array.from({ length: count }, (_, i) => ({
        id: `msg_${i}`,
        userId,
        username: `user_${userId}`,
        content: `Test message ${i + 1}`,
        roomId: 'global',
        timestamp: Date.now() - (count - i) * 1000,
        edited: false,
        deleted: false
    }));
}

export function generateTestUsers(count = 5) {
    return Array.from({ length: count }, (_, i) => ({
        userId: `user_${i}`,
        username: `testuser${i}`,
        password: `password${i}`,
        email: `test${i}@example.com`,
        status: 'online'
    }));
}

export function generateTestRooms(count = 3) {
    return Array.from({ length: count }, (_, i) => ({
        id: `room_${i}`,
        name: `Test Room ${i + 1}`,
        description: `Description for room ${i + 1}`,
        isPrivate: i % 2 === 1,
        members: [],
        createdAt: Date.now() - i * 3600000
    }));
}

export default {
    sampleUsers,
    sampleMessages,
    sampleRooms,
    samplePolls,
    sampleEmojis,
    sampleFileMetadata,
    mockResponses,
    generateTestMessages,
    generateTestUsers,
    generateTestRooms
};
