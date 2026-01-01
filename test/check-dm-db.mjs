import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('Connected');
    // Login as existing user
    ws.send(JSON.stringify({
        type: 'login',
        username: 'pphuc173',
        password: '12341234'
    }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('Received:', msg.type);
    
    if (msg.type === 'login_response' && msg.success) {
        console.log('Logged in as:', msg.userId);
        
        // Now join a DM room to test
        setTimeout(() => {
            console.log('\nJoining DM room...');
            ws.send(JSON.stringify({
                type: 'join_room',
                roomId: 'dm_625c42a6-ad45-4916-03e8-3f29fae7ee20'  // Some user ID
            }));
        }, 500);
    }
    
    if (msg.type === 'room_joined') {
        console.log('\nRoom joined:', msg.roomId);
        console.log('History count:', msg.history?.length);
        if (msg.history && msg.history.length > 0) {
            console.log('Messages:');
            msg.history.forEach((m, i) => {
                console.log(`  ${i+1}. [${m.roomId}] ${m.username}: ${m.content}`);
            });
        }
        ws.close();
    }
    
    if (msg.type === 'history') {
        console.log('Global history loaded:', msg.messages?.length);
    }
});

ws.on('error', (e) => console.error('Error:', e));

setTimeout(() => {
    console.log('Timeout');
    process.exit(0);
}, 10000);
