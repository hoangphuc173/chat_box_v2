import WebSocket from 'ws';

const SERVER_URL = 'ws://103.56.163.137:8080'; // Thay đổi nếu cần
const TEST_USERNAME = 'test_user_' + Date.now();

console.log('🔍 Testing AI Chatbot on Production Server...\n');

const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
    console.log('✅ Connected to server');
    
    // Đăng nhập
    console.log('📝 Logging in...');
    ws.send(JSON.stringify({
        type: 'login',
        username: TEST_USERNAME
    }));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message.type);
        
        if (message.type === 'login_success') {
            console.log('✅ Login successful');
            console.log('🤖 Sending AI message...\n');
            
            // Gửi tin nhắn cho AI
            ws.send(JSON.stringify({
                type: 'send_message',
                recipient: 'ai_chatbot',
                content: 'Hello, can you hear me?'
            }));
        } 
        else if (message.type === 'new_message' && message.sender === 'ai_chatbot') {
            console.log('✅ AI Response received!');
            console.log('📝 Content:', message.content);
            console.log('\n✅ TEST PASSED - Gemini API is working!\n');
            
            ws.close();
            process.exit(0);
        }
        else if (message.type === 'error') {
            console.error('❌ Error:', message.message);
            ws.close();
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Parse error:', e.message);
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    process.exit(1);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
});

// Timeout sau 30 giây
setTimeout(() => {
    console.error('❌ Test timeout - no AI response received');
    ws.close();
    process.exit(1);
}, 30000);
