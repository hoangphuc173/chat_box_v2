#ifndef ROOM_HANDLER_H
#define ROOM_HANDLER_H

#include <memory>
#include <string>
#include "../protocol_chatbox1.h"

// Forward declarations
class DynamoDBClient;
class PubSubBroker;
namespace uWS {
    template<bool SSL>
    struct WebSocket;
}

/**
 * Room Message Handler
 * 
 * Handles:
 * - MSG_ROOM_CREATE - Create new room
 * - MSG_ROOM_JOIN - Join existing room
 * - MSG_ROOM_LEAVE - Leave room
 * - MSG_ROOM_LIST - List available rooms
 * - MSG_ROOM_MEMBERS - Get room members
 * - MSG_ROOM_UPDATE - Update room info
 */
class RoomHandler {
public:
    RoomHandler(std::shared_ptr<DynamoDBClient> dbClient,
                std::shared_ptr<PubSubBroker> broker);
    
    ~RoomHandler();
    
    // Handle room messages
    void handleCreateRoom(uWS::WebSocket<false>* ws,
                          const CreateRoomPayload& payload,
                          const std::string& userId,
                          const std::string& sessionId);
    
    void handleJoinRoom(uWS::WebSocket<false>* ws,
                        const JoinRoomPayload& payload,
                        const std::string& userId,
                        const std::string& username,
                        const std::string& sessionId);
    
    void handleLeaveRoom(uWS::WebSocket<false>* ws,
                         const LeaveRoomPayload& payload,
                         const std::string& userId,
                         const std::string& sessionId);
    
    void handleListRooms(uWS::WebSocket<false>* ws);
    
    void handleGetMembers(uWS::WebSocket<false>* ws,
                          const std::string& roomId);
    
private:
    std::shared_ptr<DynamoDBClient> dbClient_;
    std::shared_ptr<PubSubBroker> broker_;
    
    // Helper functions
    void sendSuccess(uWS::WebSocket<false>* ws, uint8_t messageType, const void* payload, size_t size);
    void sendError(uWS::WebSocket<false>* ws, uint8_t messageType, const std::string& error);
    void sendPacket(uWS::WebSocket<false>* ws, const PacketHeader& header, const void* payload, size_t size);
    
    std::string generateRoomId();
    void broadcastUserJoined(const std::string& roomId, const std::string& userId, const std::string& username);
    void broadcastUserLeft(const std::string& roomId, const std::string& userId, const std::string& username);
};

#endif // ROOM_HANDLER_H
