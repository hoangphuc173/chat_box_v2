#ifndef CHAT_HANDLER_H
#define CHAT_HANDLER_H

#include <memory>
#include <string>
#include <vector>
#include "../protocol_chatbox1.h"

// Forward declarations
class DynamoDBClient;
class PubSubBroker;
class GeminiClient;
namespace uWS {
    template<bool SSL>
    struct WebSocket;
}

/**
 * Chat Message Handler
 * 
 * Handles:
 * - MSG_CHAT_TEXT - Text messages
 * - MSG_CHAT_TYPING - Typing indicators
 * - MSG_CHAT_DELETE - Message deletion
 * - MSG_CHAT_EDIT - Message editing
 */
class ChatHandler {
public:
    ChatHandler(std::shared_ptr<DynamoDBClient> dbClient,
                std::shared_ptr<PubSubBroker> broker,
                std::shared_ptr<GeminiClient> geminiClient = nullptr);
    
    ~ChatHandler();
    
    // Handle chat messages
    void handleTextMessage(uWS::WebSocket<false>* ws, 
                           const ChatTextPayload& payload,
                           const std::string& senderId,
                           const std::string& senderName);
    
    void handleTyping(uWS::WebSocket<false>* ws,
                      const TypingPayload& payload,
                      const std::string& senderId);
    
    void handleDeleteMessage(uWS::WebSocket<false>* ws,
                             const std::string& messageId,
                             const std::string& userId);
    
private:
    std::shared_ptr<DynamoDBClient> dbClient_;
    std::shared_ptr<PubSubBroker> broker_;
    std::shared_ptr<GeminiClient> geminiClient_;
    
    // Helper functions
    void sendSuccess(uWS::WebSocket<false>* ws, uint8_t messageType, const void* payload, size_t size);
    void sendError(uWS::WebSocket<false>* ws, uint8_t messageType, const std::string& error);
    void sendPacket(uWS::WebSocket<false>* ws, const PacketHeader& header, const void* payload, size_t size);
    
    std::string generateMessageId();
    
    // @Mentions support
    std::vector<std::string> parseMentions(const std::string& content);
    void sendMentionNotifications(const std::string& roomId, 
                                   const std::string& messageId,
                                   const std::string& senderName,
                                   const std::vector<std::string>& mentionedUsers);
};

#endif // CHAT_HANDLER_H
