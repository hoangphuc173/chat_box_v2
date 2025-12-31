# DynamoDB Client - 12 Tables

## Tables Implemented:
1. ✅ Users
2. ✅ Messages  
3. ✅ Rooms
4. ✅ Files
5. ✅ Sessions (with GSI)
6. ✅ Reactions
7. ✅ Polls
8. ✅ GameSessions
9. ✅ WatchSessions
10. ✅ Workflows
11. ✅ VoiceMessages
12. ✅ Presence (with TTL)

## Usage Example:
```cpp
DynamoDBClient db(accessKey, secretKey, region);

// Create user
User user = {"user123", "John Doe", "john@example.com", ...};
db.createUser(user);

// Get messages
auto messages = db.getMessages("room123", timestamp);

// Update presence
db.updatePresence("user123", UserStatus::ONLINE);
```

See implementation in `src/database/` folder.
