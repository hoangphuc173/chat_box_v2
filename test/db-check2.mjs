// Check database for DM messages using mysql2
import mysql from 'mysql2/promise';

async function checkDb() {
    console.log('Connecting to MySQL on port 3307...');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,  // Changed from X Protocol port
        user: 'chatbox',
        password: '1732005',
        database: 'chatbox_db',
        connectTimeout: 5000
    });

    try {
        console.log('=== Checking Database ===\n');
        
        // Check messages table structure
        console.log('1. Messages table room_id column:');
        const [cols] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chatbox' AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'room_id'
        `);
        if (cols.length > 0) {
            console.log('   Room ID column:', cols[0]);
        }
        
        // Check recent DM messages (room_id starts with dm_)
        console.log('\n2. Recent DM messages:');
        const [dmMsgs] = await connection.execute(`
            SELECT message_id, room_id, sender_name, content, created_at 
            FROM messages 
            WHERE room_id LIKE 'dm_%' 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.log('   DM messages found:', dmMsgs.length);
        dmMsgs.forEach((m, i) => {
            console.log(`   [${i+1}] room_id: ${m.room_id}`);
            console.log(`       from: ${m.sender_name}, content: ${m.content.substring(0, 50)}`);
        });
        
        // Check all distinct room_ids
        console.log('\n3. All distinct room_ids:');
        const [rooms] = await connection.execute(`
            SELECT room_id, COUNT(*) as msg_count 
            FROM messages 
            GROUP BY room_id 
            ORDER BY msg_count DESC 
            LIMIT 10
        `);
        rooms.forEach(r => {
            console.log(`   ${r.room_id}: ${r.msg_count} messages`);
        });
        
        // Check if dm_conversations table exists
        console.log('\n4. Checking dm_conversations table:');
        try {
            const [rows] = await connection.execute('SELECT * FROM dm_conversations LIMIT 5');
            console.log('   dm_conversations exists, rows:', rows.length);
        } catch (e) {
            console.log('   dm_conversations table does NOT exist');
        }
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

checkDb().catch(console.error);
