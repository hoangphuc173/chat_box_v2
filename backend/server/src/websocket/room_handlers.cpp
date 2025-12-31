// Room management handlers

void WebSocketServer::handleCreateRoomJson(void* wsPtr, const std::string& jsonStr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        PerSocketData* data = ws->getUserData();
        
        json msg = json::parse(jsonStr);
        std::string roomName = msg.value("roomName", "");
        std::string roomType = msg.value("roomType", "public");
        
        if (roomName.empty()) {
            sendErrorJson(wsPtr, "Room name required");
            return;
        }
        
        // Generate room ID
        std::string roomId = "room-" + std::to_string(std::time(nullptr)) + "-" + data->userId.substr(0, 8);
        
        Logger::info("🏠 Creating room: " + roomName + " (" + roomId + ") by " + data->username);
        
        // Save to database
        Room room;
        room.roomId = roomId;
        room.name = roomName;
        room.creatorId = data->userId;
        
        if (dbClient_ && dbClient_->createRoom(room)) {
            Logger::info("✅ Room saved to database: " + roomId);
        } else {
            Logger::warn("⚠️ Failed to save room to database, continuing in-memory only");
        }
        
        json response = {
            {"type", "room_created"},
            {"roomId", roomId},
            {"roomName", roomName},
            {"roomType", roomType}
        };
        
        sendJsonMessage(wsPtr, response.dump());
        Logger::info("✅ Room created: " + roomId);
        
    } catch (const std::exception& e) {
        Logger::error("Create room error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to create room");
    }
}

void WebSocketServer::handleJoinRoomJson(void* wsPtr, const std::string& jsonStr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        PerSocketData* data = ws->getUserData();
        
        json msg = json::parse(jsonStr);
        std::string roomId = msg.value("roomId", "");
        
        if (roomId.empty()) {
            sendErrorJson(wsPtr, "Room ID required");
            return;
        }
        
        Logger::info("🚪 User joining room: " + data->username + " → " + roomId);
        
        // Save to room_members table
        if (dbClient_) {
            dbClient_->addRoomMember(roomId, data->userId);
        }
        
        // Load room history
        std::vector<Message> history;
        if (dbClient_) {
            history = dbClient_->getRecentMessages(roomId, 50, 0);
        }
        
        json response = {
            {"type", "room_joined"},
            {"roomId", roomId},
            {"userId", data->userId},
            {"username", data->username}
        };
        
        // Send to user who joined
        sendJsonMessage(wsPtr, response.dump());
        
        // Send room history
        if (!history.empty()) {
            json historyResponse = {
                {"type", "room_history"},
                {"roomId", roomId},
                {"messages", json::array()}
            };
            for (const auto& msg : history) {
                historyResponse["messages"].push_back({
                    {"messageId", msg.messageId},
                    {"senderId", msg.senderId},
                    {"senderName", msg.senderName},
                    {"content", msg.content},
                    {"timestamp", msg.timestamp}
                });
            }
            sendJsonMessage(wsPtr, historyResponse.dump());
        }
        
        // Broadcast to others in room
        json broadcast = {
            {"type", "user_joined_room"},
            {"roomId", roomId},
            {"userId", data->userId},
            {"username", data->username}
        };
        broadcastToRoom(roomId, broadcast.dump(), data->userId);
        
        Logger::info("✅ User joined room: " + roomId);
        
    } catch (const std::exception& e) {
        Logger::error("Join room error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to join room");
    }
}

void WebSocketServer::handleLeaveRoomJson(void* wsPtr, const std::string& jsonStr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        PerSocketData* data = ws->getUserData();
        
        json msg = json::parse(jsonStr);
        std::string roomId = msg.value("roomId", "");
        
        if (roomId.empty()) {
            sendErrorJson(wsPtr, "Room ID required");
            return;
        }
        
        Logger::info("🚪 User leaving room: " + data->username + " ← " + roomId);
        
        // Remove from room_members table
        if (dbClient_) {
            dbClient_->removeRoomMember(roomId, data->userId);
        }
        
        json response = {
            {"type", "room_left"},
            {"roomId", roomId}
        };
        sendJsonMessage(wsPtr, response.dump());
        
        // Broadcast to others
        json broadcast = {
            {"type", "user_left_room"},
            {"roomId", roomId},
            {"userId", data->userId},
            {"username", data->username}
        };
        broadcastToRoom(roomId, broadcast.dump(), data->userId);
        
        Logger::info("✅ User left room: " + roomId);
        
    } catch (const std::exception& e) {
        Logger::error("Leave room error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to leave room");
    }
}

void WebSocketServer::handleGetRoomsJson(void* wsPtr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        
        // Query database for rooms
        json rooms = json::array();
        
        // Always include global room
        rooms.push_back({
            {"roomId", "global"},
            {"roomName", "Global Chat"},
            {"roomType", "public"},
            {"unread", 0}
        });
        
        // Get user's rooms from database
        if (dbClient_) {
            PerSocketData* data = ws->getUserData();
            // Query rooms where user is a member
            try {
                // For now, just return global room
                // TODO: Query user's rooms from database
            } catch (...) {
                Logger::warn("Could not load user rooms from database");
            }
        }
        
        json response = {
            {"type", "room_list"},
            {"rooms", rooms}
        };
        
        sendJsonMessage(wsPtr, response.dump());
        Logger::info("📋 Sent room list");
        
    } catch (const std::exception& e) {
        Logger::error("Get rooms error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to get rooms");
    }
}
