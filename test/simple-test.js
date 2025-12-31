import WebSocket from 'ws';

console.log('🧪 ChatBox Simple Connection Test\n');
console.log('='.repeat(50));

// Test connection
console.log('\n📡 Testing WebSocket connection to ws://localhost:8080...\n');

const ws = new WebSocket('ws://localhost:8080');
let connected = false;

ws.on('open', () => {
    connected = true;
    console.log('✅ Connected to WebSocket server!');
    console.log('📤 Sending login message...\n');

    // Try to login
    ws.send(JSON.stringify({
        type: 'login',
        username: 'testuser999',
        password: 'test999'
    }));
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data.toString());
        console.log(`📥 Received: ${msg.type}`);
        console.log(`   Data: ${JSON.stringify(msg, null, 2)}\n`);

        if (msg.type === 'login_response') {
            if (msg.success) {
                console.log('✅ LOGIN SUCCESS!');
                console.log(`   Token: ${msg.token.substring(0, 30)}...`);
                console.log(`   User ID: ${msg.userId}\n`);

                // Send a test message
                console.log('📤 Sending test message...\n');
                ws.send(JSON.stringify({
                    type: 'chat',
                    content: 'Automated test message from test suite!',
                    roomId: 'global'
                }));

                // Wait a bit then close
                setTimeout(() => {
                    console.log('✅ All tests passed!');
                    console.log('🔌 Closing connection...\n');
                    ws.close();
                    process.exit(0);
                }, 2000);
            } else {
                console.log('❌ LOGIN FAILED!');
                console.log(`   Message: ${msg.message}\n`);
                ws.close();
                process.exit(1);
            }
        }
    } catch (e) {
        console.error('❌ Error parsing message:', e.message);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error.message);
    console.error('\n⚠️  Make sure backend server is running on ws://localhost:8080\n');
    process.exit(1);
});

ws.on('close', () => {
    if (!connected) {
        console.error('❌ Failed to connect to server');
        console.error('⚠️  Backend server may not be running\n');
        process.exit(1);
    }
});

// Timeout after 10 seconds
setTimeout(() => {
    console.error('❌ Test timeout (10s)');
    ws.close();
    process.exit(1);
}, 10000);
