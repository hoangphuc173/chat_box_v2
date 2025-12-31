#ifndef AUTH_HANDLER_H
#define AUTH_HANDLER_H

#include <memory>
#include <string>
#include <vector>
#include "../protocol_chatbox1.h"

// Forward declarations
class AuthManager;
class DynamoDBClient;
namespace uWS {
    template<bool SSL>
    struct WebSocket;
}

/**
 * Authentication Message Handler
 * 
 * Handles:
 * - MSG_AUTH_REGISTER - User registration
 * - MSG_AUTH_LOGIN - User login
 * - MSG_AUTH_LOGOUT - User logout
 * - MSG_AUTH_REFRESH_TOKEN - Token refresh
 */
class AuthHandler {
public:
    AuthHandler(std::shared_ptr<AuthManager> authManager,
                std::shared_ptr<DynamoDBClient> dbClient);
    
    ~AuthHandler();
    
    // Handle authentication messages
    void handleRegister(uWS::WebSocket<false>* ws, const RegisterPayload& payload);
    void handleLogin(uWS::WebSocket<false>* ws, const LoginPayload& payload);
    void handleLogout(uWS::WebSocket<false>* ws, const LogoutPayload& payload);
    void handleRefreshToken(uWS::WebSocket<false>* ws, const std::string& oldToken);
    
private:
    std::shared_ptr<AuthManager> authManager_;
    std::shared_ptr<DynamoDBClient> dbClient_;
    
    // Helper functions
    void sendSuccess(uWS::WebSocket<false>* ws, uint8_t messageType, const void* payload, size_t size);
    void sendError(uWS::WebSocket<false>* ws, uint8_t messageType, const std::string& error);
    void sendPacket(uWS::WebSocket<false>* ws, const PacketHeader& header, const void* payload, size_t size);
};

#endif // AUTH_HANDLER_H
