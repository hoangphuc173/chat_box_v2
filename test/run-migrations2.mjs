// Run migrations for DM support - with FK handling
import mysql from 'mysql2/promise';

async function runMigrations() {
    console.log('Connecting to MySQL...');
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3307,
        user: 'chatbox',
        password: '1732005',
        database: 'chatbox_db',
        connectTimeout: 5000
    });

    try {
        console.log('=== Running DM Migrations (with FK handling) ===\n');
        
        // Disable foreign key checks temporarily
        console.log('1. Disabling foreign key checks...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('   ✓ FK checks disabled');
        
        // 2. Alter room_id columns
        console.log('\n2. Altering room_id columns to VARCHAR(128)...');
        
        const tables = ['messages', 'files', 'rooms', 'room_members', 'pinned_messages', 'polls'];
        
        for (const table of tables) {
            try {
                // First check if column exists
                const [cols] = await connection.execute(`
                    SELECT CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'chatbox_db' 
                    AND TABLE_NAME = ? 
                    AND COLUMN_NAME = 'room_id'
                `, [table]);
                
                if (cols.length > 0 && cols[0].CHARACTER_MAXIMUM_LENGTH < 128) {
                    await connection.execute(`ALTER TABLE ${table} MODIFY COLUMN room_id VARCHAR(128)`);
                    console.log(`   ✓ ${table}.room_id updated to 128 chars`);
                } else if (cols.length > 0) {
                    console.log(`   ○ ${table}.room_id already >= 128 chars`);
                } else {
                    console.log(`   - ${table} has no room_id column`);
                }
            } catch (e) {
                console.log(`   ✗ ${table}: ${e.message}`);
            }
        }
        
        // Re-enable foreign key checks
        console.log('\n3. Re-enabling foreign key checks...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('   ✓ FK checks enabled');
        
        console.log('\n=== Migrations Complete ===');
        
        // Verify
        console.log('\nVerification:');
        const [verify] = await connection.execute(`
            SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'chatbox_db' AND COLUMN_NAME = 'room_id'
            ORDER BY TABLE_NAME
        `);
        for (const col of verify) {
            const status = col.CHARACTER_MAXIMUM_LENGTH >= 128 ? '✓' : '✗';
            console.log(`   ${status} ${col.TABLE_NAME}.${col.COLUMN_NAME}: ${col.CHARACTER_MAXIMUM_LENGTH} chars`);
        }
        
    } catch (err) {
        console.error('Error:', err.message);
        // Make sure to re-enable FK checks even on error
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    } finally {
        await connection.end();
    }
}

runMigrations().catch(console.error);
