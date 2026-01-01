import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8080';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createUser(name, password) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        let userId = null;
        let loginAttempted = false;
        
        ws.on('open', () => {
            console.log(`[${name}] Connected`);
            // Login (or register first)
            ws.send(JSON.stringify({
                type: 'register',
                username: name,
                password: password
            }));
        });
        
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            console.log(`[${name}] Received: ${JSON.stringify(msg)}`);
            
            if ((msg.type === 'register_success' || msg.type === 'register_response' || msg.type === 'error') && !loginAttempted) {
                loginAttempted = true;
                // Try login
                console.log(`[${name}] Attempting login...`);
                ws.send(JSON.stringify({
                    type: 'login',
                    username: name,
                    password: password
                }));
            }
            
            if (msg.type === 'login_response' && msg.success) {
                userId = msg.userId;
                console.log(`[${name}] ✅ Logged in: ${userId}`);
                resolve({ ws, userId, name });
            }
            
            if (msg.type === 'chat') {
                console.log(`[${name}] 📩 Received message in room "${msg.roomId}": "${msg.content}" from ${msg.username}`);
            }
            
            if (msg.type === 'room_joined') {
                console.log(`[${name}] 📜 Joined room "${msg.roomId}" - History: ${msg.history?.length || 0} messages`);
                if (msg.history && msg.history.length > 0) {
                    msg.history.forEach((m, i) => {
                        console.log(`[${name}]   ${i+1}. [${m.roomId}] ${m.username}: ${m.content}`);
                    });
                }
            }
        });
        
        ws.on('error', (err) => {
            console.log(`[${name}] Error: ${err}`);
            reject(err);
        });
        
        setTimeout(() => reject(new Error('Timeout')), 10000);
    });
}

async function main() {
    console.log('========================================');
    console.log('DM (Direct Message) Test with Persistence');
    console.log('========================================\n');
    
    try {
        // Use fixed usernames to test persistence across page reloads
        const timestamp = Date.now();
        const user1 = await createUser('dmtest_alice_' + timestamp, 'pass123');
        const user2 = await createUser('dmtest_bob_' + timestamp, 'pass123');
        
        console.log(`\nAlice ID: ${user1.userId}`);
        console.log(`Bob ID: ${user2.userId}`);
        
        // Calculate canonical roomId
        let canonicalRoomId;
        if (user1.userId < user2.userId) {
            canonicalRoomId = 'dm_' + user1.userId + '_' + user2.userId;
        } else {
            canonicalRoomId = 'dm_' + user2.userId + '_' + user1.userId;
        }
        console.log(`Canonical roomId should be: ${canonicalRoomId}`);
        
        await sleep(500);
        
        console.log('\n--- Test 1: Alice sends DM to Bob ---');
        // Alice sends to Bob using dm_bobId format
        const dmRoomId = 'dm_' + user2.userId;
        console.log(`[Alice] Sending DM to room: ${dmRoomId}`);
        
        user1.ws.send(JSON.stringify({
            type: 'chat',
            roomId: dmRoomId,
            content: 'Hello Bob! This is message 1 from Alice.'
        }));
        
        await sleep(2000);  // Wait longer for DB save
        
        console.log('\n--- Test 2: Bob sends DM to Alice ---');
        // Bob sends to Alice using dm_aliceId format
        const dmRoomId2 = 'dm_' + user1.userId;
        console.log(`[Bob] Sending DM to room: ${dmRoomId2}`);
        
        user2.ws.send(JSON.stringify({
            type: 'chat',
            roomId: dmRoomId2,
            content: 'Hi Alice! Got your message. Reply from Bob.'
        }));
        
        await sleep(2000);  // Wait longer for DB save
        
        console.log('\n--- Test 3: Alice joins DM room to load history ---');
        // Alice joins the DM room to load history
        user1.ws.send(JSON.stringify({
            type: 'join_room',
            roomId: dmRoomId
        }));
        
        await sleep(1500);
        
        console.log('\n--- Test 4: Bob joins DM room to load history ---');
        // Bob joins the DM room to load history
        user2.ws.send(JSON.stringify({
            type: 'join_room',
            roomId: dmRoomId2
        }));
        
        await sleep(1500);
        
        console.log('\n========================================');
        console.log('DM Test Complete!');
        console.log('Check if history was loaded correctly.');
        console.log('========================================');
        
        user1.ws.close();
        user2.ws.close();
        
    } catch (error) {
        console.error('Test failed:', error);
    }
    
    process.exit(0);
}

main();
