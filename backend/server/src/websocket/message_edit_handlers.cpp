void WebSocketServer::handleEditMessageJson(void* wsPtr, const std::string& jsonStr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        PerSocketData* data = ws->getUserData();
        
        json msg = json::parse(jsonStr);
        std::string messageId = msg.value("messageId", "");
        std::string newContent = msg.value("newContent", "");
        
        if (messageId.empty() || newContent.empty()) {
            sendErrorJson(wsPtr, "Missing messageId or newContent");
            return;
        }
        
        Logger::info("✏️ Edit message request: " + messageId + " by " + data->username);
        
        // TODO: Verify user owns this message
        // TODO: Update in database
        // For now, just broadcast the edit
        
        json response = {
            {"type", "message_edited"},
            {"messageId", messageId},
            {"newContent", newContent},
            {"editedAt", std::time(nullptr)},
            {"userId", data->userId}
        };
        
        // Broadcast to room
        broadcastToRoom("global", response.dump());
        Logger::info("✅ Message edited and broadcasted");
        
    } catch (const std::exception& e) {
        Logger::error("Edit message error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to edit message");
    }
}

void WebSocketServer::handleDeleteMessageJson(void* wsPtr, const std::string& jsonStr) {
    try {
        auto* ws = (uWS::WebSocket<false, true, PerSocketData>*)wsPtr;
        PerSocketData* data = ws->getUserData();
        
        json msg = json::parse(jsonStr);
        std::string messageId = msg.value("messageId", "");
        
        if (messageId.empty()) {
            sendErrorJson(wsPtr, "Missing messageId");
            return;
        }
        
        Logger::info("🗑️ Delete message request: " + messageId + " by " + data->username);
        
        // TODO: Verify user owns this message
        // TODO: Soft delete in database (is_deleted=1)
        // For now, just broadcast the deletion
        
        json response = {
            {"type", "message_deleted"},
            {"messageId", messageId},
            {"userId", data->userId}
        };
        
        // Broadcast to room
        broadcastToRoom("global", response.dump());
        Logger::info("✅ Message deleted and broadcasted");
        
    } catch (const std::exception& e) {
        Logger::error("Delete message error: " + std::string(e.what()));
        sendErrorJson(wsPtr, "Failed to delete message");
    }
}
