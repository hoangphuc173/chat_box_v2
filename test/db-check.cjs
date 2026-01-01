const mysqlx = require('@mysql/xdevapi');

async function main() {
    console.log('Starting...');
    try {
        console.log('Connecting to MySQL...');
        const session = await mysqlx.getSession({
            host: 'localhost',
            port: 33070,
            user: 'root',
            password: '1732005',
            connectTimeout: 5000
        });
        
        console.log('Connected to MySQL X Protocol!');
        
        // Check DM messages
        const result = await session.sql('SELECT room_id, LENGTH(room_id) as len, LEFT(content, 40) as content FROM chatbox.messages WHERE room_id LIKE "dm_%" ORDER BY created_at DESC LIMIT 10').execute();
        const rows = result.fetchAll();
        console.log('\n=== DM Messages ===');
        console.log('Count:', rows.length);
        rows.forEach(r => {
            console.log('  Room:', r[0], '(len:', r[1] + ')');
            console.log('  Content:', r[2]);
        });
        
        // Check column size
        const colResult = await session.sql('SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA="chatbox" AND TABLE_NAME="messages" AND COLUMN_NAME="room_id"').execute();
        const colRows = colResult.fetchAll();
        console.log('\n=== room_id Column ===');
        console.log('Max Length:', colRows[0] ? colRows[0][0] : 'N/A');
        
        await session.close();
    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
