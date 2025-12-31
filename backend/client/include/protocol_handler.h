#pragma once

#include <string>
#include <functional>
#include <map>
#include <memory>

namespace chatbox {

/**
 * Message types matching the WebSocket protocol
 */
enum class MessageType {
    // Authentication
    Login,
    Register,
    AuthSuccess,
    AuthError,
    
    // Chat
    Chat,
    ChatHistory,
    EditMessage,
    DeleteMessage,
    
    // Rooms
    JoinRoom,
    LeaveRoom,
    CreateRoom,
    RoomList,
    RoomCreated,
    RoomJoined,
    RoomLeft,
    
    // Reactions
    Reaction,
    ReactionAdded,
    
    // Presence
    Presence,
    PresenceUpdate,
    Typing,
    
    // WebRTC
    CallInit,
    CallOffer,
    CallAnswer,
    IceCandidate,
    CallEnd,
    
    // Misc
    Error,
    Ping,
    Pong,
    Unknown
};

/**
 * Parsed message structure
 */
struct ParsedMessage {
    MessageType type = MessageType::Unknown;
    std::string rawType;
    std::map<std::string, std::string> stringFields;
    std::map<std::string, int> intFields;
    std::map<std::string, bool> boolFields;
    std::string rawJson;
    
    std::string getString(const std::string& key, const std::string& defaultValue = "") const {
        auto it = stringFields.find(key);
        return it != stringFields.end() ? it->second : defaultValue;
    }
    
    int getInt(const std::string& key, int defaultValue = 0) const {
        auto it = intFields.find(key);
        return it != intFields.end() ? it->second : defaultValue;
    }
    
    bool getBool(const std::string& key, bool defaultValue = false) const {
        auto it = boolFields.find(key);
        return it != boolFields.end() ? it->second : defaultValue;
    }
};

/**
 * Protocol handler for parsing and creating messages
 */
class ProtocolHandler {
public:
    ProtocolHandler();
    
    // Parse incoming JSON message
    ParsedMessage parse(const std::string& json);
    
    // Create outgoing messages
    std::string createLoginMessage(const std::string& username, const std::string& password);
    std::string createRegisterMessage(const std::string& username, const std::string& password, const std::string& email);
    std::string createChatMessage(const std::string& roomId, const std::string& content);
    std::string createEditMessage(const std::string& messageId, const std::string& content);
    std::string createDeleteMessage(const std::string& messageId);
    std::string createReactionMessage(const std::string& messageId, const std::string& emoji);
    std::string createJoinRoomMessage(const std::string& roomId);
    std::string createLeaveRoomMessage(const std::string& roomId);
    std::string createRoomMessage(const std::string& name);
    std::string createPresenceMessage(const std::string& status);
    std::string createTypingMessage(const std::string& roomId, bool isTyping);
    std::string createPingMessage();

private:
    MessageType stringToType(const std::string& type);
    std::string escapeJson(const std::string& str);
};

} // namespace chatbox
