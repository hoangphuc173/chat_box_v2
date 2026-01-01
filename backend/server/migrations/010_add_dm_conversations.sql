-- Migration: Add DM Conversations table
-- Purpose: Store DM conversation mapping like Discord/Telegram
-- Each DM between 2 users has a unique conversation_id

-- DM Conversations table
-- Stores mapping between user pairs and their conversation ID
CREATE TABLE IF NOT EXISTS dm_conversations (
    conversation_id VARCHAR(64) PRIMARY KEY,
    user1_id VARCHAR(64) NOT NULL,  -- Always the smaller UUID (for consistency)
    user2_id VARCHAR(64) NOT NULL,  -- Always the larger UUID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Ensure user1_id < user2_id for consistency
    CONSTRAINT chk_user_order CHECK (user1_id < user2_id),
    
    -- Unique constraint: only one conversation per user pair
    UNIQUE KEY unique_user_pair (user1_id, user2_id),
    
    -- Indexes for quick lookup
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_last_message (last_message_at DESC)
);

-- Also increase room_id column size to accommodate longer IDs if needed
ALTER TABLE messages MODIFY COLUMN room_id VARCHAR(128) NOT NULL;
ALTER TABLE rooms MODIFY COLUMN room_id VARCHAR(128);
ALTER TABLE room_members MODIFY COLUMN room_id VARCHAR(128) NOT NULL;
ALTER TABLE files MODIFY COLUMN room_id VARCHAR(128) NOT NULL;
ALTER TABLE pinned_messages MODIFY COLUMN room_id VARCHAR(128) NOT NULL;
ALTER TABLE polls MODIFY COLUMN room_id VARCHAR(128) NOT NULL;
