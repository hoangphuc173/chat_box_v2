#include "handlers/room_handler.h"
#include "database/dynamo_client.h"
#include "pubsub/pubsub_broker.h"
#include "utils/logger.h"
#include <uWebSockets/App.h>
#include <cstring>
#include <chrono>
#include <random>
#include <sstream>

using namespace std::chrono;

RoomHandler::RoomHandler(std::shared_ptr<DynamoDBClient> dbClient,
                         std::shared_ptr<PubSubBroker> broker)
    : dbClient_(dbClient)
    , broker_(broker) {
    Logger::info("Room handler initialized");
}

RoomHandler::~RoomHandler() {
    Logger::info("Room handler destroyed");
}

// ============================================================================
// CREATE ROOM
// ============================================================================

void RoomHandler::handleCreateRoom(uWS::WebSocket<false>* ws,
                                    const CreateRoomPayload& payload,
                                    const std::string& userId,
                                    const std::string& sessionId) {
    try {
        std::string roomName(payload.roomName);
        std::string description(payload.description);
        RoomType roomType = static_cast<RoomType>(payload.roomType);
        
        Logger::info("Creating room: " + roomName + " by " + userId);
        
        // Create room structure
        Room room;
        room.roomId = generateRoomId();
        room.name = roomName;
        room.description = description;
        room.type = roomType;
        room.creatorId = userId;
        room.createdAt = duration_cast<seconds>(
            system_clock::now().time_since_epoch()
        ).count();
        
        // Add creator as first member
        room.memberIds.push_back(userId);
        
        // Save to database
        bool created = dbClient_->createRoom(room);
        
        if (!created) {
            sendError(ws, MSG_ROOM_CREATE_RESPONSE, "Failed to create room");
            return;
        }
        
        // Subscribe creator to room topic
        broker_->subscribe(sessionId, "room:" + room.roomId,
            [ws](const std::string& topic, const std::string& msg, const std::string& sender) {
                // Forward message to WebSocket
                ws->send(msg, uWS::OpCode::BINARY);
            });
        
        // Create response
        CreateRoomResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.roomId, room.roomId.c_str(), sizeof(response.roomId) - 1);
        std::strncpy(response.roomName, roomName.c_str(), sizeof(response.roomName) - 1);
        response.createdAt = room.createdAt;
        std::strncpy(response.message, "Room created successfully", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_ROOM_CREATE_RESPONSE, &response, sizeof(response));
        
        Logger::info("Room created: " + room.roomId + " (" + roomName + ")");
        
    } catch (const std::exception& e) {
        Logger::error("Create room error: " + std::string(e.what()));
        sendError(ws, MSG_ROOM_CREATE_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// JOIN ROOM
// ============================================================================

void RoomHandler::handleJoinRoom(uWS::WebSocket<false>* ws,
                                  const JoinRoomPayload& payload,
                                  const std::string& userId,
                                  const std::string& username,
                                  const std::string& sessionId) {
    try {
        std::string roomId(payload.roomId);
        
        Logger::info("User " + username + " joining room: " + roomId);
        
        // Check if room exists
        auto room = dbClient_->getRoom(roomId);
        
        if (!room.has_value()) {
            sendError(ws, MSG_ROOM_JOIN_RESPONSE, "Room not found");
            return;
        }
        
        // Check if user is already a member
        auto& members = room->memberIds;
        bool alreadyMember = std::find(members.begin(), members.end(), userId) != members.end();
        
        if (!alreadyMember) {
            // Add user to room
            bool added = dbClient_->addRoomMember(roomId, userId);
            
            if (!added) {
                sendError(ws, MSG_ROOM_JOIN_RESPONSE, "Failed to join room");
                return;
            }
        }
        
        // Subscribe to room topic
        broker_->subscribe(sessionId, "room:" + roomId,
            [ws](const std::string& topic, const std::string& msg, const std::string& sender) {
                ws->send(msg, uWS::OpCode::BINARY);
            });
        
        // Create response
        JoinRoomResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.roomId, roomId.c_str(), sizeof(response.roomId) - 1);
        std::strncpy(response.roomName, room->name.c_str(), sizeof(response.roomName) - 1);
        response.memberCount = static_cast<uint32_t>(room->memberIds.size() + (alreadyMember ? 0 : 1));
        std::strncpy(response.message, "Joined room successfully", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_ROOM_JOIN_RESPONSE, &response, sizeof(response));
        
        // Broadcast to room that user joined (if not already a member)
        if (!alreadyMember) {
            broadcastUserJoined(roomId, userId, username);
        }
        
        Logger::info("User " + username + " joined room: " + roomId);
        
    } catch (const std::exception& e) {
        Logger::error("Join room error: " + std::string(e.what()));
        sendError(ws, MSG_ROOM_JOIN_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// LEAVE ROOM
// ============================================================================

void RoomHandler::handleLeaveRoom(uWS::WebSocket<false>* ws,
                                   const LeaveRoomPayload& payload,
                                   const std::string& userId,
                                   const std::string& sessionId) {
    try {
        std::string roomId(payload.roomId);
        
        Logger::info("User " + userId + " leaving room: " + roomId);
        
        // Remove user from room
        bool removed = dbClient_->removeRoomMember(roomId, userId);
        
        if (!removed) {
            sendError(ws, MSG_ROOM_LEAVE_RESPONSE, "Failed to leave room");
            return;
        }
        
        // Unsubscribe from room topic
        broker_->unsubscribe(sessionId, "room:" + roomId);
        
        // Create response
        LeaveRoomResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.roomId, roomId.c_str(), sizeof(response.roomId) - 1);
        std::strncpy(response.message, "Left room successfully", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_ROOM_LEAVE_RESPONSE, &response, sizeof(response));
        
        // Broadcast to room that user left
        broadcastUserLeft(roomId, userId, userId); // TODO: Get username
        
        Logger::info("User " + userId + " left room: " + roomId);
        
    } catch (const std::exception& e) {
        Logger::error("Leave room error: " + std::string(e.what()));
        sendError(ws, MSG_ROOM_LEAVE_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// LIST ROOMS
// ============================================================================

void RoomHandler::handleListRooms(uWS::WebSocket<false>* ws) {
    try {
        Logger::debug("Listing rooms");
        
        // TODO: Implement room listing (scan or GSI)
        // For now, return empty list
        
        ListRoomsResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.roomCount = 0;
        std::strncpy(response.message, "Room listing not implemented", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_ROOM_LIST_RESPONSE, &response, sizeof(response));
        
    } catch (const std::exception& e) {
        Logger::error("List rooms error: " + std::string(e.what()));
        sendError(ws, MSG_ROOM_LIST_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// GET MEMBERS
// ============================================================================

void RoomHandler::handleGetMembers(uWS::WebSocket<false>* ws,
                                    const std::string& roomId) {
    try {
        Logger::debug("Getting members for room: " + roomId);
        
        // Get room
        auto room = dbClient_->getRoom(roomId);
        
        if (!room.has_value()) {
            sendError(ws, MSG_ROOM_MEMBERS_RESPONSE, "Room not found");
            return;
        }
        
        // TODO: Return member list
        // For now, just return count
        
        RoomMembersResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.memberCount = static_cast<uint32_t>(room->memberIds.size());
        std::strncpy(response.roomId, roomId.c_str(), sizeof(response.roomId) - 1);
        
        sendSuccess(ws, MSG_ROOM_MEMBERS_RESPONSE, &response, sizeof(response));
        
    } catch (const std::exception& e) {
        Logger::error("Get members error: " + std::string(e.what()));
        sendError(ws, MSG_ROOM_MEMBERS_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

void RoomHandler::sendSuccess(uWS::WebSocket<false>* ws,
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

void RoomHandler::sendError(uWS::WebSocket<false>* ws,
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

void RoomHandler::sendPacket(uWS::WebSocket<false>* ws,
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

std::string RoomHandler::generateRoomId() {
    auto now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    
    std::stringstream ss;
    ss << "room_" << now << "_" << dis(gen);
    
    return ss.str();
}

void RoomHandler::broadcastUserJoined(const std::string& roomId,
                                       const std::string& userId,
                                       const std::string& username) {
    // Create user joined notification
    UserJoinedPayload payload;
    std::memset(&payload, 0, sizeof(payload));
    std::strncpy(payload.roomId, roomId.c_str(), sizeof(payload.roomId) - 1);
    std::strncpy(payload.userId, userId.c_str(), sizeof(payload.userId) - 1);
    std::strncpy(payload.username, username.c_str(), sizeof(payload.username) - 1);
    payload.timestamp = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    // Build packet
    PacketHeader header;
    header.magic = PACKET_MAGIC;
    header.version = PROTOCOL_VERSION;
    header.messageType = MSG_USER_JOINED;
    header.payloadSize = sizeof(payload);
    header.timestamp = payload.timestamp;
    
    std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(payload));
    std::memcpy(packet.data(), &header, sizeof(PacketHeader));
    std::memcpy(packet.data() + sizeof(PacketHeader), &payload, sizeof(payload));
    
    std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
    
    // Broadcast to room
    broker_->publishToRoom(roomId, packetStr, userId);
    
    Logger::debug("Broadcast: User " + username + " joined room " + roomId);
}

void RoomHandler::broadcastUserLeft(const std::string& roomId,
                                     const std::string& userId,
                                     const std::string& username) {
    // Create user left notification
    UserLeftPayload payload;
    std::memset(&payload, 0, sizeof(payload));
    std::strncpy(payload.roomId, roomId.c_str(), sizeof(payload.roomId) - 1);
    std::strncpy(payload.userId, userId.c_str(), sizeof(payload.userId) - 1);
    std::strncpy(payload.username, username.c_str(), sizeof(payload.username) - 1);
    payload.timestamp = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    // Build packet
    PacketHeader header;
    header.magic = PACKET_MAGIC;
    header.version = PROTOCOL_VERSION;
    header.messageType = MSG_USER_LEFT;
    header.payloadSize = sizeof(payload);
    header.timestamp = payload.timestamp;
    
    std::vector<uint8_t> packet(sizeof(PacketHeader) + sizeof(payload));
    std::memcpy(packet.data(), &header, sizeof(PacketHeader));
    std::memcpy(packet.data() + sizeof(PacketHeader), &payload, sizeof(payload));
    
    std::string packetStr(reinterpret_cast<char*>(packet.data()), packet.size());
    
    // Broadcast to room
    broker_->publishToRoom(roomId, packetStr, userId);
    
    Logger::debug("Broadcast: User " + username + " left room " + roomId);
}
