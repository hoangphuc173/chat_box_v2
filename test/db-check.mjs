import mysqlx from '@mysql/xdevapi';

async function main() {
    try {
        const session = await mysqlx.getSession({
            host: 'localhost',
            port: 33070,
            user: 'root',
            password: '1732005',
            schema: 'chatbox'
        });
        
        console.log('Connected to MySQL via X Protocol');
        
        // Check messages table for DM entries
        const result = await session.sql(`
            SELECT room_id, LENGTH(room_id) as len, LEFT(content, 50) as content_short, created_at 
            FROM messages 
            WHERE room_id LIKE 'dm_%' 
            ORDER BY created_at DESC 
            LIMIT 20
        `).execute();
        
        const rows = result.fetchAll();
        console.log('\n=== DM Messages in DB ===');
        console.log('Total DM messages:', rows.length);
        
        if (rows.length === 0) {
            console.log('No DM messages found in database!');
        } else {
            for (const row of rows) {
                console.log(`Room: ${row[0]} (len: ${row[1]})`);
                console.log(`  Content: ${row[2]}`);
                console.log(`  Created: ${row[3]}`);
                console.log('---');
            }
        }
        
        // Check room_id column size
        const colInfo = await session.sql(`
            SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chatbox' AND TABLE_NAME = 'messages' AND COLUMN_NAME = 'room_id'
        `).execute();
        
        const colRows = colInfo.fetchAll();
        console.log('\n=== room_id Column Info ===');
        for (const row of colRows) {
            console.log(`Column: ${row[0]}, Type: ${row[1]}, Max Length: ${row[2]}`);
        }
        
        await session.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
