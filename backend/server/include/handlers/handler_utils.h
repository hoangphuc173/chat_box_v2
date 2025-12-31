// Handler utilities for common operations

#pragma once

#include <string>
#include <vector>
#include <map>
#include <functional>
#include <nlohmann/json.hpp>

namespace chatbox {
namespace handlers {

using json = nlohmann::json;

/**
 * Request validation utilities
 */
class RequestValidator {
public:
    struct ValidationResult {
        bool isValid;
        std::string errorMessage;
        std::string errorField;
    };
    
    static ValidationResult validateChatMessage(const json& data);
    static ValidationResult validateFileUpload(const json& data, size_t fileSize);
    static ValidationResult validateRoomCreation(const json& data);
    static ValidationResult validateUserProfile(const json& data);
    static bool isValidRoomId(const std::string& roomId);
    static bool isValidUserId(const std::string& userId);
    static bool isValidEmoji(const std::string& emoji);
};

/**
 * Response builders
 */
class ResponseBuilder {
public:
    // Chat responses
    static std::string createChatResponse(
        const std::string& messageId,
        const std::string& roomId,
        const std::string& userId,
        const std::string& username,
        const std::string& content,
        long long timestamp
    );
    
    // Room responses
    static std::string createRoomListResponse(const std::vector<std::map<std::string, std::string>>& rooms);
    static std::string createRoomCreatedResponse(const std::string& roomId, const std::string& roomName);
    static std::string createRoomJoinedResponse(const std::string& roomId);
    
    // User responses
    static std::string createUserListResponse(const std::vector<std::map<std::string, std::string>>& users);
    static std::string createUserJoinedResponse(const std::string& userId, const std::string& username);
    static std::string createPresenceUpdateResponse(const std::string& userId, const std::string& status);
    
    // Message action responses
    static std::string createMessageEditedResponse(const std::string& messageId, const std::string& newContent);
    static std::string createMessageDeletedResponse(const std::string& messageId);
    static std::string createReactionAddedResponse(const std::string& messageId, const std::string& emoji, const std::string& userId, const std::string& username);
    
    // File responses
    static std::string createFileUploadedResponse(const std::string& fileId, const std::string& url);
};

/**
 * Permission checkers
 */
class PermissionChecker {
public:
    static bool canEditMessage(const std::string& userId, const std::string& messageAuthorId);
    static bool canDeleteMessage(const std::string& userId, const std::string& messageAuthorId, bool isAdmin = false);
    static bool canKickUser(const std::string& userId, const std::string& roomId, bool isAdmin = false);
    static bool canInviteToRoom(const std::string& userId, const std::string& roomId);
    static bool canUploadFile(const std::string& userId, size_t fileSize, int dailyUploadCount);
};

/**
 * Data sanitizers
 */
class DataSanitizer {
public:
    static std::string sanitizeMessage(const std::string& content);
    static std::string sanitizeUsername(const std::string& username);
    static std::string sanitizeRoomName(const std::string& roomName);
    static std::string sanitizeFilename(const std::string& filename);
    static std::string escapeHtml(const std::string& text);
    static std::string removeControlCharacters(const std::string& text);
};

/**
 * Rate limiting helpers
 */
class RateLimiter {
public:
    struct RateLimit {
        int maxRequests;
        int windowSeconds;
    };
    
    static const RateLimit MESSAGE_LIMIT;
    static const RateLimit FILE_UPLOAD_LIMIT;
    static const RateLimit REACTION_LIMIT;
    
    static bool isAllowed(
        const std::string& userId,
        const std::string& action,
        const RateLimit& limit
    );
    
    static void recordAction(
        const std::string& userId,
        const std::string& action
    );
    
    static int getRemainingRequests(
        const std::string& userId,
        const std::string& action,
        const RateLimit& limit
    );
};

/**
 * Notification helpers
 */
class NotificationHelper {
public:
    static std::string createMessageNotification(
        const std::string& senderName,
        const std::string& message,
        const std::string& roomName
    );
    
    static std::string createCallNotification(
        const std::string& callerName,
        const std::string& callType
    );
    
    static std::string createMentionNotification(
        const std::string& mentionerName,
        const std::string& message
    );
    
    static bool shouldNotify(
        const std::string& userId,
        const std::string& roomId,
        bool isMentioned = false
    );
};

/**
 * Metric collectors
 */
class MetricsCollector {
public:
    static void recordMessageSent(const std::string& roomId);
    static void recordFileUploaded(size_t fileSize);
    static void recordUserJoined(const std::string& userId);
    static void recordError(const std::string& handlerName, const std::string& errorType);
    static json getMetrics(long long since = 0);
};

} // namespace handlers
} // namespace chatbox
