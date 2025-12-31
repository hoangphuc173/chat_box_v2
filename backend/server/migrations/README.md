# Database Migrations

## How to Run Migrations

### MySQL
```bash
cd backend/server
mysql -u your_username -p chatbox_db < migrations/001_add_message_metadata.sql
```

### Verify Migration
```bash
mysql -u your_username -p chatbox_db -e "DESCRIBE messages;"
```

Expected output should include:
- `message_type` VARCHAR(20) DEFAULT 'text'
- `metadata` JSON

---

## Migration Files

### 001_add_message_metadata.sql
**Date**: 2025-12-18  
**Purpose**: Add support for voice messages and file uploads
**Changes**:
- Add `message_type` column (values: 'text', 'voice', 'file')
- Add `metadata` JSON column for file info/voice data
- Add index on `message_type`

---

## Rollback (if needed)

If you need to rollback this migration:
```sql
ALTER TABLE messages DROP INDEX idx_messages_type;
ALTER TABLE messages DROP COLUMN metadata;
ALTER TABLE messages DROP COLUMN message_type;
```

---

*Created: 2025-12-18*
