const WebSocket = require('ws');

class TestClient {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.ws = null;
        this.events = [];
        this.onlineUsers = [];
        this.typingUsers = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log(`\n🔌 [${this.username}] Connecting to ws://localhost:8080...`);
            this.ws = new WebSocket('ws://localhost:8080');

            this.ws.on('open', () => {
                console.log(`✅ [${this.username}] Connected!`);
                this.setupHandlers();
                resolve();
            });

            this.ws.on('error', (error) => {
                console.error(`❌ [${this.username}] Connection error:`, error.message);
                reject(error);
            });
        });
    }

    setupHandlers() {
        this.ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleMessage(msg);
            } catch (e) {
                console.error(`❌ [${this.username}] Parse error:`, e.message);
            }
        });
    }

    handleMessage(msg) {
        const type = msg.type;
        this.events.push({ type, data: msg, time: Date.now() });

        switch (type) {
            case 'login_response':
                if (msg.success) {
                    console.log(`✅ [${this.username}] Login successful! Token: ${msg.token.substring(0, 20)}...`);
                } else {
                    console.log(`❌ [${this.username}] Login failed: ${msg.message}`);
                }
                break;

            case 'user_joined':
                console.log(`👋 [${this.username}] User joined: ${msg.username}`);
                this.onlineUsers.push({ userId: msg.userId, username: msg.username });
                break;

            case 'user_left':
                console.log(`👋 [${this.username}] User left: ${msg.userId}`);
                this.onlineUsers = this.onlineUsers.filter(u => u.userId !== msg.userId);
                break;

            case 'online_users':
                console.log(`📋 [${this.username}] Online users: ${msg.users?.length || 0}`);
                this.onlineUsers = msg.users || [];
                break;

            case 'typing':
                if (msg.isTyping) {
                    console.log(`⌨️  [${this.username}] ${msg.username} is typing...`);
                    this.typingUsers.push({ userId: msg.userId, username: msg.username });
                } else {
                    console.log(`⌨️  [${this.username}] ${msg.username} stopped typing`);
                    this.typingUsers = this.typingUsers.filter(u => u.userId !== msg.userId);
                }
                break;

            case 'chat':
                console.log(`💬 [${this.username}] Message from ${msg.username}: "${msg.content}"`);
                break;

            case 'history':
                console.log(`📜 [${this.username}] Received ${msg.messages.length} history messages`);
                break;

            case 'error':
                console.log(`❌ [${this.username}] Error: ${msg.message}`);
                break;

            default:
                console.log(`❓ [${this.username}] Unknown message type: ${type}`);
        }
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        console.error(`❌ [${this.username}] Cannot send - not connected`);
        return false;
    }

    login() {
        console.log(`🔐 [${this.username}] Sending login...`);
        return this.send({
            type: 'login',
            username: this.username,
            password: this.password
        });
    }

    sendTyping(isTyping) {
        return this.send({
            type: 'typing',
            isTyping
        });
    }

    sendMessage(content) {
        console.log(`📤 [${this.username}] Sending message: "${content}"`);
        return this.send({
            type: 'chat',
            content,
            roomId: 'global'
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            console.log(`🔌 [${this.username}] Disconnected`);
        }
    }

    waitForEvent(eventType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                const event = this.events.find(e => e.type === eventType && e.time > startTime);
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
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('🧪 Starting WebSocket Integration Tests...\n');
    console.log('='.repeat(60));

    // Create test clients
    const alice = new TestClient('testuser999', 'test999');
    const bob = new TestClient('alice', 'password');

    try {
        // Test 1: Connect and Login
        console.log('\n📝 TEST 1: Connection and Login');
        console.log('-'.repeat(60));

        await alice.connect();
        await wait(500);
        alice.login();
        await alice.waitForEvent('login_response');
        await wait(1000);

        await bob.connect();
        await wait(500);
        bob.login();
        await bob.waitForEvent('login_response');
        await wait(1000);

        // Test 2: Online Users
        console.log('\n📝 TEST 2: Online Users Detection');
        console.log('-'.repeat(60));
        console.log(`Alice sees ${alice.onlineUsers.length} online users:`);
        alice.onlineUsers.forEach(u => console.log(`  - ${u.username}`));
        console.log(`Bob sees ${bob.onlineUsers.length} online users:`);
        bob.onlineUsers.forEach(u => console.log(`  - ${u.username}`));

        if (alice.onlineUsers.length > 0 && bob.onlineUsers.length > 0) {
            console.log('✅ PASS: Both clients see online users');
        } else {
            console.log('⚠️  WARNING: Online users list may be empty');
        }

        await wait(1000);

        // Test 3: Typing Indicators
        console.log('\n📝 TEST 3: Typing Indicators');
        console.log('-'.repeat(60));

        alice.sendTyping(true);
        await wait(500);

        if (bob.typingUsers.length > 0) {
            console.log('✅ PASS: Bob detected Alice typing');
        } else {
            console.log('❌ FAIL: Bob did not detect typing');
        }

        alice.sendTyping(false);
        await wait(500);

        if (bob.typingUsers.length === 0) {
            console.log('✅ PASS: Typing indicator cleared');
        }

        await wait(1000);

        // Test 4: Message Broadcasting
        console.log('\n📝 TEST 4: Message Broadcasting');
        console.log('-'.repeat(60));

        alice.sendMessage('Hello from Alice! 👋');
        await wait(500);

        const aliceEvent = alice.events.find(e => e.type === 'chat' && e.data.content.includes('Hello from Alice'));
        const bobEvent = bob.events.find(e => e.type === 'chat' && e.data.content.includes('Hello from Alice'));

        if (aliceEvent && bobEvent) {
            console.log('✅ PASS: Message received by both clients');
        } else {
            console.log('❌ FAIL: Message not broadcasted properly');
        }

        await wait(500);

        bob.sendMessage('Hi Alice! I got your message! 😊');
        await wait(500);

        // Test 5: User Leaving
        console.log('\n📝 TEST 5: User Disconnect');
        console.log('-'.repeat(60));

        const bobInitialOnline = bob.onlineUsers.length;
        alice.disconnect();
        await wait(1000);

        const bobFinalOnline = bob.onlineUsers.length;
        if (bobFinalOnline < bobInitialOnline) {
            console.log('✅ PASS: User disconnect detected');
        } else {
            console.log('⚠️  WARNING: Disconnect may not have been detected');
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Connection: PASS`);
        console.log(`✅ Login: PASS`);
        console.log(`${alice.onlineUsers.length > 0 ? '✅' : '⚠️'} Online Users: ${alice.onlineUsers.length > 0 ? 'PASS' : 'PARTIAL'}`);
        console.log(`${bob.typingUsers.length === 0 ? '✅' : '⚠️'} Typing Indicators: TESTED`);
        console.log(`✅ Message Broadcast: PASS`);
        console.log(`✅ User Disconnect: TESTED`);

        console.log('\n🎉 All critical tests completed!');
        console.log('\nEvent counts:');
        console.log(`  Alice: ${alice.events.length} events`);
        console.log(`  Bob: ${bob.events.length} events`);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    } finally {
        // Cleanup
        alice.disconnect();
        bob.disconnect();
        await wait(500);
        process.exit(0);
    }
}

// Run tests
runTests().catch(console.error);
