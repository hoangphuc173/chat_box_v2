// Database query builders and utilities

#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>

namespace chatbox {
namespace database {

/**
 * SQL Query Builder for common operations
 */
class QueryBuilder {
public:
    // SELECT builders
    static std::string selectUser(const std::string& username);
    static std::string selectUserById(const std::string& userId);
    static std::string selectMessages(const std::string& roomId, int limit = 50, int offset = 0);
    static std::string selectRooms(const std::string& userId);
    static std::string selectRoomMembers(const std::string& roomId);
    
    // INSERT builders
    static std::string insertUser(const std::string& username, const std::string& passwordHash, const std::string& email);
    static std::string insertMessage(const std::string& roomId, const std::string& userId, const std::string& content);
    static std::string insertRoom(const std::string& roomName, const std::string& creatorId);
    static std::string insertReaction(const std::string& messageId, const std::string& userId, const std::string& emoji);
    
    // UPDATE builders
    static std::string updateMessage(const std::string& messageId, const std::string& newContent);
    static std::string updateUserStatus(const std::string& userId, const std::string& status);
    static std::string updateUserProfile(const std::string& userId, const std::map<std::string, std::string>& fields);
    
    // DELETE builders
    static std::string deleteMessage(const std::string& messageId);
    static std::string deleteReaction(const std::string& messageId, const std::string& userId, const std::string& emoji);
};

/**
 * DynamoDB attribute builders
 */
class DynamoAttributeBuilder {
public:
    static std::string buildUserItem(const std::string& userId, const std::map<std::string, std::string>& attributes);
    static std::string buildMessageItem(const std::string& messageId, const std::map<std::string, std::string>& attributes);
    static std::string buildKeyCondition(const std::string& keyName, const std::string& value);
    static std::string buildUpdateExpression(const std::map<std::string, std::string>& updates);
    static std::string buildFilterExpression(const std::vector<std::pair<std::string, std::string>>& conditions);
};

/**
 * Connection pool helpers
 */
class ConnectionPoolHelper {
public:
    static constexpr int DEFAULT_POOL_SIZE = 10;
    static constexpr int MAX_POOL_SIZE = 50;
    static constexpr int CONNECTION_TIMEOUT_MS = 5000;
    
    static bool isConnectionHealthy(void* connection);
    static void closeConnection(void* connection);
    static int getOptimalPoolSize(int expectedLoad);
};

/**
 * Result set parsers
 */
class ResultParser {
public:
    struct UserResult {
        std::string id;
        std::string username;
        std::string email;
        std::string passwordHash;
        long long createdAt;
    };
    
    struct MessageResult {
        std::string id;
        std::string roomId;
        std::string userId;
        std::string content;
        long long timestamp;
        bool isEdited;
        bool isDeleted;
    };
    
    struct RoomResult {
        std::string id;
        std::string name;
        long long createdAt;
        int memberCount;
    };
    
    static std::vector<UserResult> parseUsers(const std::string& jsonResult);
    static std::vector<MessageResult> parseMessages(const std::string& jsonResult);
    static std::vector<RoomResult> parseRooms(const std::string& jsonResult);
};

/**
 * Database error handlers
 */
class DatabaseErrorHandler {
public:
    enum class ErrorType {
        ConnectionFailed,
        QueryFailed,
        Timeout,
        DuplicateKey,
        NotFound,
        Unknown
    };
    
    static ErrorType classifyError(const std::string& errorMessage);
    static std::string getErrorDescription(ErrorType type);
    static bool isRetryableError(ErrorType type);
    static int getRetryDelay(int attempt);
};

/**
 * Transaction helpers
 */
class TransactionHelper {
public:
    static std::string beginTransaction();
    static std::string commitTransaction();
    static std::string rollbackTransaction();
    static bool executeWithRetry(
        std::function<bool()> operation,
        int maxRetries = 3,
        int delayMs = 100
    );
};

} // namespace database
} // namespace chatbox
