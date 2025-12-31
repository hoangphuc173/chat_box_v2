import WebSocket from 'ws';

console.log('🤖 ChatBox AI Chatbot Test\n');
console.log('='.repeat(50));

const ws = new WebSocket('ws://localhost:8080');
let testsPassed = 0;
let testsFailed = 0;

ws.on('open', () => {
    console.log('✅ Connected to WebSocket\n');

    // Login first
    console.log('📤 Logging in as testuser999...');
    ws.send(JSON.stringify({
        type: 'login',
        username: 'testuser999',
        password: 'test999'
    }));
});

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data.toString());

        if (msg.type === 'login_response' && msg.success) {
            console.log('✅ Login successful!\n');

            // Test 1: Send AI command
            console.log('📋 Test 1: Sending @ai command...');
            ws.send(JSON.stringify({
                type: 'chat',
                content: '@ai Hello! Can you introduce yourself?',
                roomId: 'global'
            }));
        }

        else if (msg.type === 'ai_response') {
            console.log('\n📥 AI Response Received:');
            console.log('   Username:', msg.username || msg.data?.username);
            console.log('   Content:', (msg.content || msg.data?.content).substring(0, 100) + '...');
            console.log('   Message ID:', msg.messageId || msg.data?.messageId);
            testsPassed++;

            // Test 2: Math question
            console.log('\n📋 Test 2: Math question to AI...');
            ws.send(JSON.stringify({
                type: 'chat',
                content: '@ai What is 5 + 3?',
                roomId: 'global'
            }));
        }

        else if (msg.type === 'chat') {
            // Check if it's AI response in chat format
            if (msg.username && msg.username.toLowerCase().includes('ai')) {
                console.log('\n📥 AI Chat Message:');
                console.log('   From:', msg.username);
                console.log('   Content:', msg.content.substring(0, 100) + '...');
                testsPassed++;

                // Test 3: Regular message (should NOT trigger AI)
                console.log('\n📋 Test 3: Regular message (no @ai)...');
                ws.send(JSON.stringify({
                    type: 'chat',
                    content: 'This is a normal message without AI',
                    roomId: 'global'
                }));

                setTimeout(() => {
                    printResults();
                    ws.close();
                    process.exit(0);
                }, 3000);
            }
        }

        else if (msg.type === 'error') {
            console.log('❌ Error:', msg.message);
            testsFailed++;
        }

    } catch (e) {
        console.error('❌ Error parsing message:', e.message);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('\n🔌 Connection closed');
});

function printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 AI CHATBOT TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);

    if (testsPassed > 0 && testsFailed === 0) {
        console.log('\n🎉 AI Chatbot is working!');
    } else if (testsPassed === 0) {
        console.log('\n⚠️  AI feature may not be enabled or configured');
    }
    console.log('='.repeat(50));
}

// Timeout
setTimeout(() => {
    console.log('\n⏱️  Test timeout');
    printResults();
    ws.close();
    process.exit(0);
}, 30000);
