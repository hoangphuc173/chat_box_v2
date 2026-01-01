// Run migrations for DM support
import mysql from 'mysql2/promise';

async function runMigrations() {
    console.log('Connecting to MySQL...');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,
        user: 'chatbox',
        password: '1732005',
        database: 'chatbox_db',
        connectTimeout: 5000,
        multipleStatements: true
    });

    try {
        console.log('=== Running DM Migrations ===\n');
        
        // 1. Create dm_conversations table
        console.log('1. Creating dm_conversations table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS dm_conversations (
                conversation_id VARCHAR(64) PRIMARY KEY,
                user1_id VARCHAR(64) NOT NULL,
                user2_id VARCHAR(64) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_pair (user1_id, user2_id),
                INDEX idx_user1 (user1_id),
                INDEX idx_user2 (user2_id),
                INDEX idx_last_message (last_message_at DESC)
            )
        `);
        console.log('   ✓ dm_conversations table created');
        
        // 2. Check current room_id column size
        console.log('\n2. Checking room_id column sizes...');
        const [cols] = await connection.execute(`
            SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chatbox_db' AND COLUMN_NAME = 'room_id'
        `);
        
        for (const col of cols) {
            console.log(`   ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${col.CHARACTER_MAXIMUM_LENGTH} chars`);
            
            if (col.CHARACTER_MAXIMUM_LENGTH < 128) {
                console.log(`   → Increasing to 128 chars...`);
                try {
                    await connection.execute(`
                        ALTER TABLE ${col.TABLE_NAME} MODIFY COLUMN room_id VARCHAR(128) NOT NULL
                    `);
                    console.log(`   ✓ ${col.TABLE_NAME}.room_id updated`);
                } catch (e) {
                    // Try without NOT NULL for tables that may allow null
                    try {
                        await connection.execute(`
                            ALTER TABLE ${col.TABLE_NAME} MODIFY COLUMN room_id VARCHAR(128)
                        `);
                        console.log(`   ✓ ${col.TABLE_NAME}.room_id updated (nullable)`);
                    } catch (e2) {
                        console.log(`   ✗ Failed: ${e2.message}`);
                    }
                }
            }
        }
        
        console.log('\n=== Migrations Complete ===');
        
        // Verify
        console.log('\nVerification:');
        const [verify] = await connection.execute(`
            SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chatbox_db' AND COLUMN_NAME = 'room_id'
        `);
        for (const col of verify) {
            console.log(`   ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${col.CHARACTER_MAXIMUM_LENGTH} chars`);
        }
        
        // Check dm_conversations
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'chatbox_db' AND TABLE_NAME = 'dm_conversations'
        `);
        console.log(`   dm_conversations table exists: ${tables.length > 0 ? 'YES' : 'NO'}`);
        
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await connection.end();
    }
}

runMigrations().catch(console.error);
