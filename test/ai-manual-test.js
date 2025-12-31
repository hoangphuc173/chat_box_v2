import WebSocket from 'ws';

console.log('🤖 AI Chatbot Manual Test\n');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('✅ Connected\n');

    // Login
    ws.send(JSON.stringify({
        type: 'login',
        username: 'testuser999',
        password: 'test999'
    }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(`\n📥 Received: ${msg.type}`);

    if (msg.type === 'login_response' && msg.success) {
        console.log('✅ Logged in');
        console.log('\n📤 Sending @ai command...');

        // Send AI command
        ws.send(JSON.stringify({
            type: 'chat',
            content: '@ai Hello! What is your name?',
            roomId: 'global'
        }));

        console.log('⏳ Waiting for AI response (up to 15 seconds)...');
    }
    else if (msg.type === 'chat') {
        console.log('💬 Chat Message:');
        console.log(`   From: ${msg.username || msg.data?.username}`);
        console.log(`   Content: ${(msg.content || msg.data?.content).substring(0, 200)}`);

        // Check if it's from AI
        if (msg.username && msg.username.toLowerCase().includes('ai')) {
            console.log('\n✅ AI RESPONSE RECEIVED!');
            console.log(`\nFull AI Message:\n${msg.content || msg.data?.content}\n`);

            // Close after receiving AI response
            setTimeout(() => {
                ws.close();
                process.exit(0);
            }, 1000);
        }
    }
    else if (msg.type === 'history') {
        console.log(`📜 History: ${msg.messages?.length || msg.data?.messages?.length || 0} messages`);
    }
    else if (msg.type === 'error') {
        console.log('❌ Error:', msg.message || msg.data?.message);
    }
});

ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n🔌 Disconnected');
});

// Timeout after 20 seconds
setTimeout(() => {
    console.log('\n⏱️  Timeout - no AI response after 20s');
    console.log('❌ AI chatbot may not be working correctly');
    ws.close();
    process.exit(1);
}, 20000);
