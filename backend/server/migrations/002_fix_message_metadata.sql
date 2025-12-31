-- Migration Fix: Update message_type and add metadata
-- Date: 2025-12-18
-- Description: Fix message_type type and add metadata column

-- Modify existing message_type from INT to VARCHAR
ALTER TABLE messages MODIFY COLUMN message_type VARCHAR(20) DEFAULT 'text';

-- Add metadata column if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we check manually
SET @dbname = DATABASE();
SET @tablename = "messages";
SET @columnname = "metadata";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE messages ADD COLUMN metadata JSON"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create index on message_type (ignore if exists)
CREATE INDEX idx_messages_type ON messages(message_type);

-- Update existing rows to have 'text' for message_type
UPDATE messages SET message_type = 'text' WHERE message_type = '0' OR message_type = 0;

-- Show final structure
SELECT 'Migration completed! New structure:' as Status;
DESCRIBE messages;
