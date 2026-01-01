-- Migration to increase room_id column size for DM canonical format
-- The canonical DM roomId format (dm_uuid1_uuid2) can be up to 77 characters
-- Current VARCHAR(64) is too short

-- Increase room_id in messages table
ALTER TABLE messages MODIFY COLUMN room_id VARCHAR(128) NOT NULL;

-- Also update rooms table for consistency  
ALTER TABLE rooms MODIFY COLUMN room_id VARCHAR(128) NOT NULL;

-- Update room_members if it has room_id
ALTER TABLE room_members MODIFY COLUMN room_id VARCHAR(128) NOT NULL;

-- Verify changes
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'chatbox' 
AND COLUMN_NAME = 'room_id'
ORDER BY TABLE_NAME;
