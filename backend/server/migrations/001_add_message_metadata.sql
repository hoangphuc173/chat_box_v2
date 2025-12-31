-- Migration: Add voice messages and file metadata support
-- Date: 2025-12-18
-- Description: Add message_type and metadata columns to messages table

-- Add message_type column (default 'text' for existing messages)
ALTER TABLE messages 
ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';

-- Add metadata column for storing JSON data (file info, voice data, etc.)
ALTER TABLE messages 
ADD COLUMN metadata JSON;

-- Add index on message_type for faster filtering
CREATE INDEX idx_messages_type ON messages(message_type);

-- Example metadata structures:
-- 
-- Voice message:
-- {
--   "type": "voice",
--   "fileUrl": "/uploads/file_123.webm",
--   "fileName": "voice_message.webm",
--   "duration": 45,
--   "waveform": [0.1, 0.3, 0.5, 0.7, ...]
-- }
--
-- File message:
-- {
--   "type": "file",
--   "fileUrl": "/uploads/file_456.pdf",
--   "fileName": "document.pdf",
--   "fileSize": 1234567,
--   "mimeType": "application/pdf"
-- }
--
-- Text message (no metadata needed):
-- NULL or {}

-- Verify migration
SELECT 
    COUNT(*) as total_messages,
    message_type,
    COUNT(*) as count_by_type
FROM messages
GROUP BY message_type;
