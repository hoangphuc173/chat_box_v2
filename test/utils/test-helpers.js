import WebSocket from 'ws';

/**
 * Test Client Utility for WebSocket Testing
 * Wraps WebSocket connection with convenient testing methods
 */
export class TestClient {
    constructor(username, password, wsUrl = 'ws://localhost:8080') {
        this.username = username;
        this.password = password;
        this.wsUrl = wsUrl;
        this.ws = null;
        this.events = [];
        this.onlineUsers = [];
        this.typingUsers = [];
        this.rooms = [];
        this.messages = [];
        this.isConnected = false;
        this.token = null;
        this.userId = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                this.isConnected = true;
                this.setupHandlers();
                resolve();
            });

            this.ws.on('error', (error) => {
                this.isConnected = false;
                reject(error);
            });

            this.ws.on('close', () => {
                this.isConnected = false;
            });
        });
    }

    /**
     * Setup message handlers
     */
    setupHandlers() {
        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleMessage(msg);
            } catch (e) {
                console.error(`[${this.username}] Parse error:`, e.message);
            }
        });
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(msg) {
        const type = msg.type;
        this.events.push({ type, data: msg, time: Date.now() });

        switch (type) {
            case 'login_response':
                if (msg.success) {
                    this.token = msg.token;
                    this.userId = msg.userId;
                }
                break;

            case 'user_joined':
                this.onlineUsers.push({ userId: msg.userId, username: msg.username });
                break;

            case 'user_left':
                this.onlineUsers = this.onlineUsers.filter(u => u.userId !== msg.userId);
                break;

            case 'online_users':
                this.onlineUsers = msg.users || [];
                break;

            case 'typing':
                if (msg.isTyping) {
                    this.typingUsers.push({ userId: msg.userId, username: msg.username });
                } else {
                    this.typingUsers = this.typingUsers.filter(u => u.userId !== msg.userId);
                }
                break;

            case 'chat':
                this.messages.push(msg);
                break;

            case 'history':
                this.messages = [...this.messages, ...(msg.messages || [])];
                break;

            case 'rooms_list':
                this.rooms = msg.rooms || [];
                break;

            case 'room_created':
            case 'room_joined':
                if (msg.room && !this.rooms.find(r => r.id === msg.room.id)) {
                    this.rooms.push(msg.room);
                }
                break;
        }
    }

    /**
     * Send message to WebSocket server
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    /**
     * Login
     */
    login() {
        return this.send({
            type: 'login',
            username: this.username,
            password: this.password
        });
    }

    /**
     * Send typing indicator
     */
    sendTyping(isTyping, roomId = 'global') {
        return this.send({
            type: 'typing',
            isTyping,
            roomId
        });
    }

    /**
     * Send chat message
     */
    sendMessage(content, roomId = 'global') {
        return this.send({
            type: 'chat',
            content,
            roomId
        });
    }

    /**
     * Create room
     */
    createRoom(roomName, isPrivate = false) {
        return this.send({
            type: 'create_room',
            name: roomName,
            isPrivate
        });
    }

    /**
     * Join room
     */
    joinRoom(roomId) {
        return this.send({
            type: 'join_room',
            roomId
        });
    }

    /**
     * Leave room
     */
    leaveRoom(roomId) {
        return this.send({
            type: 'leave_room',
            roomId
        });
    }

    /**
     * Add reaction to message
     */
    addReaction(messageId, emoji) {
        return this.send({
            type: 'add_reaction',
            messageId,
            emoji
        });
    }

    /**
     * Create poll
     */
    createPoll(question, options, roomId = 'global') {
        return this.send({
            type: 'create_pool',
            question,
            options,
            roomId
        });
    }

    /**
     * Vote in poll
     */
    votePoll(pollId, optionIndex) {
        return this.send({
            type: 'vote_poll',
            pollId,
            optionIndex
        });
    }

    /**
     * Edit message
     */
    editMessage(messageId, newContent) {
        return this.send({
            type: 'edit_message',
            messageId,
            content: newContent
        });
    }

    /**
     * Delete message
     */
    deleteMessage(messageId) {
        return this.send({
            type: 'delete_message',
            messageId
        });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
        }
    }

    /**
     * Wait for specific event type
     */
    waitForEvent(eventType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const event = this.events.find(e =>
                    e.type === eventType && e.time > startTime
                );

                if (event) {
                    clearInterval(checkInterval);
                    resolve(event);
                }

                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${eventType}`));
                }
            }, 100);
        });
    }

    /**
     * Wait for event with condition
     */
    waitForEventWhere(eventType, condition, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const event = this.events.find(e =>
                    e.type === eventType &&
                    e.time > startTime &&
                    condition(e.data)
                );

                if (event) {
                    clearInterval(checkInterval);
                    resolve(event);
                }

                if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    reject(new Error(`Timeout waiting for ${eventType} with condition`));
                }
            }, 100);
        });
    }

    /**
     * Clear events history
     */
    clearEvents() {
        this.events = [];
    }

    /**
     * Get last event of type
     */
    getLastEvent(eventType) {
        const events = this.events.filter(e => e.type === eventType);
        return events[events.length - 1];
    }
}

/**
 * Helper function to wait
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random username
 */
export function randomUsername(prefix = 'user') {
    return `${prefix}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate random password
 */
export function randomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Create multiple test clients
 */
export async function createTestClients(count, wsUrl = 'ws://localhost:8080') {
    const clients = [];

    for (let i = 0; i < count; i++) {
        const username = randomUsername(`testuser${i}`);
        const password = randomPassword();
        const client = new TestClient(username, password, wsUrl);
        clients.push(client);
    }

    return clients;
}

/**
 * Connect and login multiple clients
 */
export async function connectAndLoginClients(clients) {
    for (const client of clients) {
        await client.connect();
        await wait(200);
        client.login();
        await client.waitForEvent('login_response');
        await wait(300);
    }
}

/**
 * Disconnect all clients
 */
export function disconnectAllClients(clients) {
    clients.forEach(client => client.disconnect());
}
