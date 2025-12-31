#include "protocol_handler.h"
#include <sstream>
#include <algorithm>

namespace chatbox {

ProtocolHandler::ProtocolHandler() {}

MessageType ProtocolHandler::stringToType(const std::string& type) {
    static const std::map<std::string, MessageType> typeMap = {
        {"login", MessageType::Login},
        {"register", MessageType::Register},
        {"auth_success", MessageType::AuthSuccess},
        {"auth_error", MessageType::AuthError},
        {"chat", MessageType::Chat},
        {"chat_history", MessageType::ChatHistory},
        {"edit_message", MessageType::EditMessage},
        {"delete_message", MessageType::DeleteMessage},
        {"join_room", MessageType::JoinRoom},
        {"leave_room", MessageType::LeaveRoom},
        {"create_room", MessageType::CreateRoom},
        {"room_list", MessageType::RoomList},
        {"room_created", MessageType::RoomCreated},
        {"room_joined", MessageType::RoomJoined},
        {"room_left", MessageType::RoomLeft},
        {"reaction", MessageType::Reaction},
        {"reaction_added", MessageType::ReactionAdded},
        {"presence", MessageType::Presence},
        {"presence_update", MessageType::PresenceUpdate},
        {"typing", MessageType::Typing},
        {"call_init", MessageType::CallInit},
        {"call_offer", MessageType::CallOffer},
        {"call_answer", MessageType::CallAnswer},
        {"ice_candidate", MessageType::IceCandidate},
        {"call_end", MessageType::CallEnd},
        {"error", MessageType::Error},
        {"ping", MessageType::Ping},
        {"pong", MessageType::Pong}
    };
    
    auto it = typeMap.find(type);
    return it != typeMap.end() ? it->second : MessageType::Unknown;
}

std::string ProtocolHandler::escapeJson(const std::string& str) {
    std::string result;
    result.reserve(str.size() * 2);
    
    for (char c : str) {
        switch (c) {
            case '"': result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default: result += c;
        }
    }
    
    return result;
}

ParsedMessage ProtocolHandler::parse(const std::string& json) {
    ParsedMessage msg;
    msg.rawJson = json;
    
    // Simple JSON parser (for production, use nlohmann/json or similar)
    // This is a basic implementation for demonstration
    
    // Find "type" field
    size_t typePos = json.find("\"type\"");
    if (typePos != std::string::npos) {
        size_t colonPos = json.find(':', typePos);
        size_t quoteStart = json.find('"', colonPos);
        size_t quoteEnd = json.find('"', quoteStart + 1);
        
        if (quoteStart != std::string::npos && quoteEnd != std::string::npos) {
            msg.rawType = json.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
            msg.type = stringToType(msg.rawType);
        }
    }
    
    // Parse common string fields
    std::vector<std::string> stringFieldNames = {
        "username", "content", "roomId", "messageId", "userId",
        "emoji", "status", "token", "error", "name", "senderId", "senderName"
    };
    
    for (const auto& fieldName : stringFieldNames) {
        std::string searchKey = "\"" + fieldName + "\"";
        size_t pos = json.find(searchKey);
        
        if (pos != std::string::npos) {
            size_t colonPos = json.find(':', pos);
            size_t quoteStart = json.find('"', colonPos);
            size_t quoteEnd = json.find('"', quoteStart + 1);
            
            if (quoteStart != std::string::npos && quoteEnd != std::string::npos) {
                msg.stringFields[fieldName] = json.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
            }
        }
    }
    
    // Parse common int fields
    std::vector<std::string> intFieldNames = {"timestamp", "count"};
    
    for (const auto& fieldName : intFieldNames) {
        std::string searchKey = "\"" + fieldName + "\"";
        size_t pos = json.find(searchKey);
        
        if (pos != std::string::npos) {
            size_t colonPos = json.find(':', pos);
            if (colonPos != std::string::npos) {
                size_t start = colonPos + 1;
                while (start < json.size() && (json[start] == ' ' || json[start] == '\t')) start++;
                
                size_t end = start;
                while (end < json.size() && (json[end] >= '0' && json[end] <= '9')) end++;
                
                if (end > start) {
                    msg.intFields[fieldName] = std::stoi(json.substr(start, end - start));
                }
            }
        }
    }
    
    // Parse bool fields
    std::vector<std::string> boolFieldNames = {"success", "isTyping", "online"};
    
    for (const auto& fieldName : boolFieldNames) {
        std::string searchKey = "\"" + fieldName + "\"";
        size_t pos = json.find(searchKey);
        
        if (pos != std::string::npos) {
            size_t colonPos = json.find(':', pos);
            if (colonPos != std::string::npos) {
                size_t valueStart = json.find_first_not_of(" \t", colonPos + 1);
                if (valueStart != std::string::npos) {
                    msg.boolFields[fieldName] = (json.substr(valueStart, 4) == "true");
                }
            }
        }
    }
    
    return msg;
}

std::string ProtocolHandler::createLoginMessage(const std::string& username, const std::string& password) {
    std::ostringstream ss;
    ss << R"({"type":"login","username":")" << escapeJson(username) 
       << R"(","password":")" << escapeJson(password) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createRegisterMessage(const std::string& username, const std::string& password, const std::string& email) {
    std::ostringstream ss;
    ss << R"({"type":"register","username":")" << escapeJson(username)
       << R"(","password":")" << escapeJson(password)
       << R"(","email":")" << escapeJson(email) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createChatMessage(const std::string& roomId, const std::string& content) {
    std::ostringstream ss;
    ss << R"({"type":"chat","roomId":")" << escapeJson(roomId)
       << R"(","content":")" << escapeJson(content) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createEditMessage(const std::string& messageId, const std::string& content) {
    std::ostringstream ss;
    ss << R"({"type":"edit_message","messageId":")" << escapeJson(messageId)
       << R"(","content":")" << escapeJson(content) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createDeleteMessage(const std::string& messageId) {
    std::ostringstream ss;
    ss << R"({"type":"delete_message","messageId":")" << escapeJson(messageId) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createReactionMessage(const std::string& messageId, const std::string& emoji) {
    std::ostringstream ss;
    ss << R"({"type":"reaction","messageId":")" << escapeJson(messageId)
       << R"(","emoji":")" << escapeJson(emoji) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createJoinRoomMessage(const std::string& roomId) {
    std::ostringstream ss;
    ss << R"({"type":"join_room","roomId":")" << escapeJson(roomId) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createLeaveRoomMessage(const std::string& roomId) {
    std::ostringstream ss;
    ss << R"({"type":"leave_room","roomId":")" << escapeJson(roomId) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createRoomMessage(const std::string& name) {
    std::ostringstream ss;
    ss << R"({"type":"create_room","name":")" << escapeJson(name) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createPresenceMessage(const std::string& status) {
    std::ostringstream ss;
    ss << R"({"type":"presence","status":")" << escapeJson(status) << R"("})";
    return ss.str();
}

std::string ProtocolHandler::createTypingMessage(const std::string& roomId, bool isTyping) {
    std::ostringstream ss;
    ss << R"({"type":"typing","roomId":")" << escapeJson(roomId)
       << R"(","isTyping":)" << (isTyping ? "true" : "false") << "}";
    return ss.str();
}

std::string ProtocolHandler::createPingMessage() {
    return R"({"type":"ping"})";
}

} // namespace chatbox
