#include "handlers/chat_handler.h"
#include "handlers/bot_handler.h"
#include "database/dynamo_client.h"
#include "pubsub/pubsub_broker.h"
#include "ai/gemini_client.h"
#include "utils/logger.h"
#include <uWebSockets/App.h>
#include <cstring>
#include <chrono>
#include <random>
#include <sstream>
#include <iomanip>
#include <regex>

using namespace std::chrono;

ChatHandler::ChatHandler(std::shared_ptr<DynamoDBClient> dbClient,
                         std::shared_ptr<PubSubBroker> broker,
                         std::shared_ptr<GeminiClient> geminiClient)
    : dbClient_(dbClient)
    , broker_(broker)
    , geminiClient_(geminiClient) {
    Logger::info("Chat handler initialized" + 
                 (geminiClient_ ? " with AI support" : ""));
}

ChatHandler::~ChatHandler() {
    Logger::info("Chat handler destroyed");
}

// ============================================================================
// TEXT MESSAGE
// ============================================================================

void ChatHandler::handleTextMessage(uWS::WebSocket<false>* ws,
                                     const ChatTextPayload& payload,
                                     const std::string& senderId,
                                     const std::string& senderName) {
    try {
        std::string roomId(payload.roomId);
        std::string content(payload.content);
        
        Logger::info("Chat message in room " + roomId + " from " + senderName);
        
        // Check if this is a bot command (starts with /)
        if (!content.empty() && content[0] == '/') {
            // Create bot handler on demand
            auto botHandler = std::make_unique<BotHandler>(dbClient_, broker_);
            auto response = botHandler->handleCommand(content, roomId, senderId, senderName);
            
            if (response.has_value()) {
                // Create bot message
                Message botMessage;
                botMessage.messageId = generateMessageId();
                botMessage.roomId = roomId;
                botMessage.senderId = "system-bot";
                botMessage.senderName = "🤖 Bot";
                botMessage.content = response.value();
                botMessage.messageType = MSG_CHAT_TEXT;
                botMessage.timestamp = duration_cast<milliseconds>(
                    system_clock::now().time_since_epoch()
                ).count();
                
                // Save bot response to database
                dbClient_->createMessage(botMessage);
                
                // Broadcast bot response to room
                ChatTextPayload botPayload;
                std::memset(&botPayload, 0, sizeof(botPayload));
                std::strncpy(botPayload.roomId, roomId.c_str(), sizeof(botPayload.roomId) - 1);
                std::strncpy(botPayload.senderId, "system-bot", sizeof(botPayload.senderId) - 1);
                std::strncpy(botPayload.senderName, "🤖 Bot", sizeof(botPayload.senderName) - 1);
                std::strncpy(botPayload.content, botMessage.content.c_str(), sizeof(botPayload.content) - 1);
                botPayload.timestamp = botMessage.timestamp;
                
                PacketHeader header;
                header.magic = PACKET_MAGIC;
                header.version = PROTOCOL_VERSION;
                header.messageType = MSG_CHAT_TEXT;
                header.payloadSize = sizeof(botPayload);
                header.timestamp = botMessage.timestamp;
                
                std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(botPayload));
                std::memcpy(packet.data(), &header, sizeof(PacketHeader));
                std::memcpy(packet.data() + sizeof(PacketHeader), &botPayload, sizeof(botPayload));
                
                std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
                broker_->publishToRoom(roomId, packetStr, "system-bot");
                
                Logger::info("Bot response sent to room: " + roomId);
                
                // Send success to requester
                ChatTextResponsePayload successResponse;
                std::memset(&successResponse, 0, sizeof(successResponse));
                successResponse.success = 1;
                std::strncpy(successResponse.messageId, botMessage.messageId.c_str(), sizeof(successResponse.messageId) - 1);
                successResponse.timestamp = botMessage.timestamp;
                std::strncpy(successResponse.message, "Command executed", sizeof(successResponse.message) - 1);
                sendSuccess(ws, MSG_CHAT_TEXT_RESPONSE, &successResponse, sizeof(successResponse));
                return;
            }
        }
        
        // Check if this is an AI command (@ai)
        if (content.length() > 3 && content.substr(0, 3) == "@ai" && geminiClient_) {
            // Extract the actual question (remove @ai prefix)
            std::string question = content.substr(3);
            // Trim leading spaces
            size_t start = question.find_first_not_of(" \t");
            if (start != std::string::npos) {
                question = question.substr(start);
            }
            
            Logger::info("AI command detected: " + question);
            
            // Get AI response
            auto aiResponse = geminiClient_->sendMessage(question);
            
            if (aiResponse.has_value()) {
                // Create AI bot message
                Message aiMessage;
                aiMessage.messageId = generateMessageId();
                aiMessage.roomId = roomId;
                aiMessage.senderId = "ai-bot";
                aiMessage.senderName = "AI Assistant";
                aiMessage.content = aiResponse.value();
                aiMessage.messageType = MSG_CHAT_TEXT;
                aiMessage.timestamp = duration_cast<milliseconds>(
                    system_clock::now().time_since_epoch()
                ).count();
                
                // Save AI response to database
                dbClient_->createMessage(aiMessage);
                
                // Broadcast AI response to room
                ChatTextPayload aiPayload;
                std::memset(&aiPayload, 0, sizeof(aiPayload));
                std::strncpy(aiPayload.roomId, roomId.c_str(), sizeof(aiPayload.roomId) - 1);
                std::strncpy(aiPayload.senderId, "ai-bot", sizeof(aiPayload.senderId) - 1);
                std::strncpy(aiPayload.senderName, "AI Assistant", sizeof(aiPayload.senderName) - 1);
                std::strncpy(aiPayload.content, aiMessage.content.c_str(), sizeof(aiPayload.content) - 1);
                aiPayload.timestamp = aiMessage.timestamp;
                
                PacketHeader header;
                header.magic = PACKET_MAGIC;
                header.version = PROTOCOL_VERSION;
                header.messageType = MSG_CHAT_TEXT;
                header.payloadSize = sizeof(aiPayload);
                header.timestamp = aiMessage.timestamp;
                
                std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(aiPayload));
                std::memcpy(packet.data(), &header, sizeof(PacketHeader));
                std::memcpy(packet.data() + sizeof(PacketHeader), &aiPayload, sizeof(aiPayload));
                
                std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
                broker_->publishToRoom(roomId, packetStr, "ai-bot");
                
                Logger::info("AI response sent to room: " + roomId);
                
                // Send success to requester
                ChatTextResponsePayload response;
                std::memset(&response, 0, sizeof(response));
                response.success = 1;
                std::strncpy(response.messageId, aiMessage.messageId.c_str(), sizeof(response.messageId) - 1);
                response.timestamp = aiMessage.timestamp;
                std::strncpy(response.message, "AI response sent", sizeof(response.message) - 1);
                sendSuccess(ws, MSG_CHAT_TEXT_RESPONSE, &response, sizeof(response));
                return;
            } else {
                Logger::error("Failed to get AI response");
                sendError(ws, MSG_CHAT_TEXT_RESPONSE, "AI service unavailable");
                return;
            }
        }
        
        // Create message
        Message message;
        message.messageId = generateMessageId();
        message.roomId = roomId;
        message.senderId = senderId;
        message.senderName = senderName;
        message.content = content;
        message.messageType = MSG_CHAT_TEXT;
        message.timestamp = duration_cast<milliseconds>(
            system_clock::now().time_since_epoch()
        ).count();
        
        if (payload.replyToId[0] != '\0') {
            message.replyToId = std::string(payload.replyToId);
        }
        
        // Save to database
        bool saved = dbClient_->createMessage(message);
        
        if (!saved) {
            sendError(ws, MSG_CHAT_TEXT_RESPONSE, "Failed to save message");
            return;
        }
        
        // Create response
        ChatTextResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.messageId, message.messageId.c_str(), sizeof(response.messageId) - 1);
        response.timestamp = message.timestamp;
        std::strncpy(response.message, "Message sent", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_CHAT_TEXT_RESPONSE, &response, sizeof(response));
        
        // Broadcast to room (via Pub/Sub)
        // Create broadcast payload
        ChatTextPayload broadcastPayload;
        std::memset(&broadcastPayload, 0, sizeof(broadcastPayload));
        std::strncpy(broadcastPayload.roomId, roomId.c_str(), sizeof(broadcastPayload.roomId) - 1);
        std::strncpy(broadcastPayload.senderId, senderId.c_str(), sizeof(broadcastPayload.senderId) - 1);
        std::strncpy(broadcastPayload.senderName, senderName.c_str(), sizeof(broadcastPayload.senderName) - 1);
        std::strncpy(broadcastPayload.content, content.c_str(), sizeof(broadcastPayload.content) - 1);
        broadcastPayload.timestamp = message.timestamp;
        
        if (!message.replyToId.empty()) {
            std::strncpy(broadcastPayload.replyToId, message.replyToId.c_str(), 
                        sizeof(broadcastPayload.replyToId) - 1);
        }
        
        // Build packet for broadcast
        PacketHeader header;
        header.magic = PACKET_MAGIC;
        header.version = PROTOCOL_VERSION;
        header.messageType = MSG_CHAT_TEXT;
        header.payloadSize = sizeof(broadcastPayload);
        header.timestamp = message.timestamp;
        
        std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(broadcastPayload));
        std::memcpy(packet.data(), &header, sizeof(PacketHeader));
        std::memcpy(packet.data() + sizeof(PacketHeader), &broadcastPayload, sizeof(broadcastPayload));
        
        std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
        
        // Publish to room topic
        broker_->publishToRoom(roomId, packetStr, senderId);
        
        Logger::debug("Message broadcast to room: " + roomId);
        
        // Parse and handle @mentions
        auto mentions = parseMentions(content);
        if (!mentions.empty()) {
            sendMentionNotifications(roomId, message.messageId, senderName, mentions);
        }
        
    } catch (const std::exception& e) {
        Logger::error("Text message error: " + std::string(e.what()));
        sendError(ws, MSG_CHAT_TEXT_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

void ChatHandler::handleTyping(uWS::WebSocket<false>* ws,
                                const TypingPayload& payload,
                                const std::string& senderId) {
    try {
        std::string roomId(payload.roomId);
        bool isTyping = payload.isTyping != 0;
        
        Logger::debug("Typing indicator: " + senderId + " in " + roomId + " = " + 
                     (isTyping ? "typing" : "stopped"));
        
        // Don't save to database, just broadcast
        
        // Build packet
        PacketHeader header;
        header.magic = PACKET_MAGIC;
        header.version = PROTOCOL_VERSION;
        header.messageType = MSG_CHAT_TYPING;
        header.payloadSize = sizeof(payload);
        header.timestamp = duration_cast<milliseconds>(
            system_clock::now().time_since_epoch()
        ).count();
        
        std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(payload));
        std::memcpy(packet.data(), &header, sizeof(PacketHeader));
        std::memcpy(packet.data() + sizeof(PacketHeader), &payload, sizeof(payload));
        
        std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
        
        // Publish to room (don't send back to sender)
        broker_->publishToRoom(roomId, packetStr, senderId);
        
    } catch (const std::exception& e) {
        Logger::error("Typing indicator error: " + std::string(e.what()));
    }
}

// ============================================================================
// DELETE MESSAGE
// ============================================================================

void ChatHandler::handleDeleteMessage(uWS::WebSocket<false>* ws,
                                       const std::string& messageId,
                                       const std::string& userId) {
    try {
        Logger::info("Delete message: " + messageId + " by " + userId);
        
        // Get message to verify ownership
        auto message = dbClient_->getMessage(messageId);
        
        if (!message.has_value()) {
            sendError(ws, MSG_CHAT_DELETE_RESPONSE, "Message not found");
            return;
        }
        
        // Check if user owns the message
        if (message->senderId != userId) {
            sendError(ws, MSG_CHAT_DELETE_RESPONSE, "Not authorized to delete this message");
            return;
        }
        
        // Delete from database
        bool deleted = dbClient_->deleteMessage(messageId);
        
        if (!deleted) {
            sendError(ws, MSG_CHAT_DELETE_RESPONSE, "Failed to delete message");
            return;
        }
        
        // Send success response
        DeleteMessageResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.messageId, messageId.c_str(), sizeof(response.messageId) - 1);
        std::strncpy(response.message, "Message deleted", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_CHAT_DELETE_RESPONSE, &response, sizeof(response));
        
        // Broadcast deletion to room
        // TODO: Send deletion notification to room members
        
        Logger::info("Message deleted: " + messageId);
        
    } catch (const std::exception& e) {
        Logger::error("Delete message error: " + std::string(e.what()));
        sendError(ws, MSG_CHAT_DELETE_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

void ChatHandler::sendSuccess(uWS::WebSocket<false>* ws,
                               uint8_t messageType,
                               const void* payload,
                               size_t size) {
    PacketHeader header;
    header.magic = PACKET_MAGIC;
    header.version = PROTOCOL_VERSION;
    header.messageType = messageType;
    header.payloadSize = size;
    header.timestamp = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    sendPacket(ws, header, payload, size);
}

void ChatHandler::sendError(uWS::WebSocket<false>* ws,
                             uint8_t messageType,
                             const std::string& error) {
    ErrorPayload errorPayload;
    std::memset(&errorPayload, 0, sizeof(errorPayload));
    errorPayload.errorCode = 400;
    std::strncpy(errorPayload.errorMessage, error.c_str(), sizeof(errorPayload.errorMessage) - 1);
    
    PacketHeader header;
    header.magic = PACKET_MAGIC;
    header.version = PROTOCOL_VERSION;
    header.messageType = messageType;
    header.payloadSize = sizeof(errorPayload);
    header.timestamp = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    sendPacket(ws, header, &errorPayload, sizeof(errorPayload));
}

void ChatHandler::sendPacket(uWS::WebSocket<false>* ws,
                              const PacketHeader& header,
                              const void* payload,
                              size_t size) {
    std::vector<uint8_t> packet(sizeof(PacketHeader) + size);
    std::memcpy(packet.data(), &header, sizeof(PacketHeader));
    
    if (size > 0 && payload) {
        std::memcpy(packet.data() + sizeof(PacketHeader), payload, size);
    }
    
    ws->send(std::string_view(reinterpret_cast<char*>(packet.data()), packet.size()),
             uWS::OpCode::BINARY);
}

std::string ChatHandler::generateMessageId() {
    // Generate unique message ID using timestamp + random
    auto now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    
    std::stringstream ss;
    ss << "msg_" << now << "_" << dis(gen);
    
    return ss.str();
}

// ============================================================================
// @MENTIONS SUPPORT
// ============================================================================

std::vector<std::string> ChatHandler::parseMentions(const std::string& content) {
    std::vector<std::string> mentions;
    
    // Regex pattern for @username (alphanumeric + underscore, 1-32 chars)
    std::regex mentionPattern("@([a-zA-Z0-9_]{1,32})");
    
    auto begin = std::sregex_iterator(content.begin(), content.end(), mentionPattern);
    auto end = std::sregex_iterator();
    
    for (std::sregex_iterator i = begin; i != end; ++i) {
        std::smatch match = *i;
        std::string username = match[1].str(); // Group 1 is the username without @
        
        // Avoid duplicates
        if (std::find(mentions.begin(), mentions.end(), username) == mentions.end()) {
            mentions.push_back(username);
        }
    }
    
    Logger::debug("Parsed " + std::to_string(mentions.size()) + " mentions from message");
    return mentions;
}

void ChatHandler::sendMentionNotifications(const std::string& roomId,
                                            const std::string& messageId,
                                            const std::string& senderName,
                                            const std::vector<std::string>& mentionedUsers) {
    if (mentionedUsers.empty()) return;
    
    Logger::info("Sending mention notifications to " + std::to_string(mentionedUsers.size()) + " users");
    
    for (const auto& username : mentionedUsers) {
        // Skip if user mentioned themselves
        if (username == senderName) continue;
        
        // Build notification payload
        // Note: Protocol defines MSG_PRESENCE_UPDATE for notifications
        // We'll create a simple text notification for now
        
        std::string notificationContent = senderName + " mentioned you in " + roomId;
        
        // Publish to user's personal notification topic
        std::string notificationTopic = "notification:" + username;
        
        // Create a simple JSON notification (since we don't have a specific payload)
        std::string jsonNotification = "{\"type\":\"mention\",\"from\":\"" + senderName + 
                                       "\",\"room\":\"" + roomId + 
                                       "\",\"messageId\":\"" + messageId + "\"}";
        
        broker_->publish(notificationTopic, jsonNotification);
        
        Logger::debug("Sent mention notification to: " + username);
    }
}
