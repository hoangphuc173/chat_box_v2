#ifndef DYNAMO_CLIENT_H
#define DYNAMO_CLIENT_H

#include <string>
#include <vector>
#include <optional>
#include <memory>
#include <map>
#include <aws/core/Aws.h>
#include <aws/dynamodb/DynamoDBClient.h>
#include "../protocol_chatbox1.h"
#include "../utils/lru_cache.h"

// Forward declarations of table types
struct User {
    std::string userId;
    std::string username;
    std::string email;
    std::string passwordHash;
    uint64_t createdAt;
    UserStatus status;
    std::string statusMessage;
};

struct UserSession {
    std::string sessionId;
    std::string userId;
    std::string username;
    uint64_t createdAt;
    uint64_t lastHeartbeat;
    uint64_t expiresAt;
};

struct Message {
    std::string messageId;
    std::string roomId;
    std::string senderId;
    std::string senderName;
    uint64_t timestamp;
    std::string content;
    uint32_t messageType;
    std::string replyToId;
};

struct Room {
    std::string roomId;
    std::string name;
    RoomType type;
    std::string creatorId;
    uint64_t createdAt;
    std::vector<std::string> memberIds;
    std::string description;
};

struct FileInfo {
    std::string fileId;
    std::string filename;
    std::string s3Url;
    uint64_t fileSize;
    FileType fileType;
    std::string uploadedBy;
    uint64_t uploadedAt;
    std::string roomId;
};

struct Reaction {
    std::string messageId;
    std::string userId;
    std::string emoji;
    uint64_t timestamp;
};

struct Poll {
    std::string pollId;
    std::string roomId;
    std::string creatorId;
    std::string question;
    std::vector<std::string> options;
    std::map<int, std::vector<std::string>> votes;
    uint64_t createdAt;
    uint64_t expiresAt;
    bool closed;
};

struct GameSession {
    std::string gameId;
    std::string roomId;
    GameType gameType;
    std::vector<std::string> playerIds;
    std::string currentTurn;
    std::string boardState;
    std::string winnerId;
    uint64_t createdAt;
    bool ended;
};

struct WatchSession {
    std::string sessionId;
    std::string roomId;
    std::string videoUrl;
    uint64_t currentTime;
    bool isPlaying;
    std::string controller;
    uint64_t lastSyncTime;
};

struct Workflow {
    std::string workflowId;
    std::string name;
    std::string triggerId;
    std::string actionType;
    std::string actionData;
    std::string creatorId;
    bool enabled;
};

struct VoiceMessage {
    std::string voiceId;
    std::string roomId;
    std::string senderId;
    std::string s3Url;
    uint32_t duration;
    uint64_t timestamp;
};

struct Presence {
    std::string userId;
    UserStatus status;
    std::string statusMessage;
    uint64_t lastSeen;
    uint64_t expiresAt;
};

// Main DynamoDB client
class DynamoDBClient {
public:
    DynamoDBClient(const std::string& accessKey,
                   const std::string& secretKey,
                   const std::string& region);
    
    ~DynamoDBClient();
    
    // Users table
    bool createUser(const User& user);
    std::optional<User> getUser(const std::string& userId);
    bool updateUserStatus(const std::string& userId, UserStatus status);
    bool deleteUser(const std::string& userId);
    
    // Sessions table
    bool createSession(const UserSession& UserSession);
    std::optional<UserSession> getSession(const std::string& sessionId);
    std::vector<UserSession> getUserSessions(const std::string& userId);
    bool updateSessionHeartbeat(const std::string& sessionId, uint64_t timestamp);
    bool deleteSession(const std::string& sessionId);
    
    // Messages table
    bool createMessage(const Message& message);
    std::optional<Message> getMessage(const std::string& messageId);
    std::vector<Message> getRoomMessages(const std::string& roomId, uint64_t fromTime, int limit = 50);
    bool deleteMessage(const std::string& messageId);
    
    // Rooms table
    bool createRoom(const Room& room);
    std::optional<Room> getRoom(const std::string& roomId);
    bool updateRoom(const Room& room);
    bool deleteRoom(const std::string& roomId);
    bool addRoomMember(const std::string& roomId, const std::string& userId);
    bool removeRoomMember(const std::string& roomId, const std::string& userId);
    
    // Files table
    bool createFile(const FileInfo& file);
    std::optional<FileInfo> getFile(const std::string& fileId);
    std::vector<FileInfo> getRoomFiles(const std::string& roomId);
    bool deleteFile(const std::string& fileId);
    
    // Reactions table
    bool addReaction(const Reaction& reaction);
    std::vector<Reaction> getMessageReactions(const std::string& messageId);
    bool removeReaction(const std::string& messageId, const std::string& userId);
    
    // Polls table
    bool createPoll(const Poll& poll);
    std::optional<Poll> getPoll(const std::string& pollId);
    bool votePoll(const std::string& pollId, const std::string& userId, int optionIndex);
    bool closePoll(const std::string& pollId);
    
    // GameSessions table
    bool createGameSession(const GameSession& game);
    std::optional<GameSession> getGameSession(const std::string& gameId);
    bool updateGameState(const std::string& gameId, const std::string& boardState, const std::string& currentTurn);
    bool endGame(const std::string& gameId, const std::string& winnerId);
    
    // WatchSessions table
    bool createWatchSession(const WatchSession& watch);
    std::optional<WatchSession> getWatchSession(const std::string& sessionId);
    bool updateWatchState(const std::string& sessionId, uint64_t currentTime, bool isPlaying);
    
    // Workflows table
    bool createWorkflow(const Workflow& workflow);
    std::optional<Workflow> getWorkflow(const std::string& workflowId);
    bool updateWorkflow(const Workflow& workflow);
    bool deleteWorkflow(const std::string& workflowId);
    
    // VoiceMessages table
    bool createVoiceMessage(const VoiceMessage& voice);
    std::optional<VoiceMessage> getVoiceMessage(const std::string& voiceId);
    std::vector<VoiceMessage> getRoomVoiceMessages(const std::string& roomId);
    
    // Presence table (with TTL)
    bool updatePresence(const Presence& presence);
    std::optional<Presence> getPresence(const std::string& userId);
    std::vector<Presence> getOnlineUsers();
    
private:
    std::shared_ptr<::Aws::DynamoDB::DynamoDBClient> client_;
    std::string region_;
    
    // Helper functions
    Aws::DynamoDB::Model::AttributeValue toAttributeValue(const std::string& value);
    Aws::DynamoDB::Model::AttributeValue toAttributeValue(uint64_t value);
    Aws::DynamoDB::Model::AttributeValue toAttributeValue(int value);
    Aws::DynamoDB::Model::AttributeValue toAttributeValue(uint32_t value);
    Aws::DynamoDB::Model::AttributeValue toAttributeValue(bool value);
    
    std::string fromAttributeValue(const Aws::DynamoDB::Model::AttributeValue& attr);
    uint64_t fromAttributeValueUint64(const Aws::DynamoDB::Model::AttributeValue& attr);
    int fromAttributeValueInt(const Aws::DynamoDB::Model::AttributeValue& attr);
    bool fromAttributeValueBool(const Aws::DynamoDB::Model::AttributeValue& attr);
    int fromAttributeValueInt(const Aws::DynamoDB::Model::AttributeValue& attr);
    bool fromAttributeValueBool(const Aws::DynamoDB::Model::AttributeValue& attr);

    // Caches
    LRUCache<std::string, User> userCache_{1000};      // Cache up to 1000 users
    LRUCache<std::string, UserSession> sessionCache_{1000}; // Cache up to 1000 sessions
};

#endif // DYNAMO_CLIENT_H
