#include "handlers/auth_handler.h"
#include "auth/auth_manager.h"
#include "database/dynamo_client.h"
#include "utils/logger.h"
#include <uWebSockets/App.h>
#include <cstring>
#include <chrono>

using namespace std::chrono;

AuthHandler::AuthHandler(std::shared_ptr<AuthManager> authManager,
                         std::shared_ptr<DynamoDBClient> dbClient)
    : authManager_(authManager)
    , dbClient_(dbClient) {
    Logger::info("Auth handler initialized");
}

AuthHandler::~AuthHandler() {
    Logger::info("Auth handler destroyed");
}

// ============================================================================
// REGISTER
// ============================================================================

void AuthHandler::handleRegister(uWS::WebSocket<false>* ws, const RegisterPayload& payload) {
    try {
        Logger::info("Registration attempt: " + std::string(payload.username));
        
        // Validate input
        std::string username(payload.username);
        std::string password(payload.password);
        std::string email(payload.email);
        
        if (username.empty() || password.empty() || email.empty()) {
            sendError(ws, MSG_AUTH_REGISTER_RESPONSE, "Username, password, and email are required");
            return;
        }
        
        // Check if username already exists
        auto existingUser = dbClient_->getUser(username);
        if (existingUser.has_value()) {
            sendError(ws, MSG_AUTH_REGISTER_RESPONSE, "Username already exists");
            return;
        }
        
        // Register user (this hashes password and creates user in DB)
        auto registerResult = authManager_->registerUser(username, password, email);
        
        if (!registerResult.success) {
            sendError(ws, MSG_AUTH_REGISTER_RESPONSE, registerResult.message);
            return;
        }
        
        // Create response
        RegisterResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.userId, registerResult.userId.c_str(), sizeof(response.userId) - 1);
        std::strncpy(response.username, username.c_str(), sizeof(response.username) - 1);
        std::strncpy(response.message, "Registration successful", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_AUTH_REGISTER_RESPONSE, &response, sizeof(response));
        
        Logger::info("User registered: " + username);
        
    } catch (const std::exception& e) {
        Logger::error("Register error: " + std::string(e.what()));
        sendError(ws, MSG_AUTH_REGISTER_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// LOGIN
// ============================================================================

void AuthHandler::handleLogin(uWS::WebSocket<false>* ws, const LoginPayload& payload) {
    try {
        std::string username(payload.username);
        std::string password(payload.password);
        
        Logger::info("Login attempt: " + username);
        
        // Validate credentials
        auto loginResult = authManager_->login(username, password);
        
        if (!loginResult.success) {
            sendError(ws, MSG_AUTH_LOGIN_RESPONSE, loginResult.message);
            Logger::warning("Login failed for: " + username);
            return;
        }
        
        // Create response
        LoginResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.userId, loginResult.userId.c_str(), sizeof(response.userId) - 1);
        std::strncpy(response.username, username.c_str(), sizeof(response.username) - 1);
        std::strncpy(response.token, loginResult.token.c_str(), sizeof(response.token) - 1);
        std::strncpy(response.sessionId, loginResult.sessionId.c_str(), sizeof(response.sessionId) - 1);
        response.expiresAt = loginResult.expiresAt;
        std::strncpy(response.message, "Login successful", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_AUTH_LOGIN_RESPONSE, &response, sizeof(response));
        
        Logger::info("User logged in: " + username + " (UserSession: " + loginResult.sessionId + ")");
        
    } catch (const std::exception& e) {
        Logger::error("Login error: " + std::string(e.what()));
        sendError(ws, MSG_AUTH_LOGIN_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// LOGOUT
// ============================================================================

void AuthHandler::handleLogout(uWS::WebSocket<false>* ws, const LogoutPayload& payload) {
    try {
        std::string sessionId(payload.sessionId);
        
        Logger::info("Logout: UserSession " + sessionId);
        
        // Logout (invalidate UserSession)
        bool success = authManager_->logout(sessionId);
        
        // Create response
        LogoutResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = success ? 1 : 0;
        std::strncpy(response.message, 
                     success ? "Logged out successfully" : "Logout failed",
                     sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_AUTH_LOGOUT_RESPONSE, &response, sizeof(response));
        
        if (success) {
            Logger::info("UserSession logged out: " + sessionId);
        }
        
    } catch (const std::exception& e) {
        Logger::error("Logout error: " + std::string(e.what()));
        sendError(ws, MSG_AUTH_LOGOUT_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// REFRESH TOKEN
// ============================================================================

void AuthHandler::handleRefreshToken(uWS::WebSocket<false>* ws, const std::string& oldToken) {
    try {
        Logger::debug("Token refresh requested");
        
        // Validate old token
        auto tokenData = authManager_->validateToken(oldToken);
        
        if (!tokenData.valid) {
            sendError(ws, MSG_AUTH_REFRESH_TOKEN_RESPONSE, "Invalid token");
            return;
        }
        
        // Generate new token
        uint64_t expiresAt = duration_cast<seconds>(
            system_clock::now().time_since_epoch()
        ).count() + 86400; // 24 hours
        
        std::string newToken = authManager_->generateToken(tokenData.userId, tokenData.username, expiresAt);
        
        // Create response (reuse LoginResponse structure)
        LoginResponsePayload response;
        std::memset(&response, 0, sizeof(response));
        response.success = 1;
        std::strncpy(response.userId, tokenData.userId.c_str(), sizeof(response.userId) - 1);
        std::strncpy(response.username, tokenData.username.c_str(), sizeof(response.username) - 1);
        std::strncpy(response.token, newToken.c_str(), sizeof(response.token) - 1);
        response.expiresAt = expiresAt;
        std::strncpy(response.message, "Token refreshed", sizeof(response.message) - 1);
        
        sendSuccess(ws, MSG_AUTH_REFRESH_TOKEN_RESPONSE, &response, sizeof(response));
        
        Logger::debug("Token refreshed for user: " + tokenData.username);
        
    } catch (const std::exception& e) {
        Logger::error("Refresh token error: " + std::string(e.what()));
        sendError(ws, MSG_AUTH_REFRESH_TOKEN_RESPONSE, "Internal server error");
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

void AuthHandler::sendSuccess(uWS::WebSocket<false>* ws, 
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

void AuthHandler::sendError(uWS::WebSocket<false>* ws,
                             uint8_t messageType,
                             const std::string& error) {
    // Create error response
    ErrorPayload errorPayload;
    std::memset(&errorPayload, 0, sizeof(errorPayload));
    errorPayload.errorCode = 400; // Bad request
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
    
    Logger::debug("Sent error: " + error);
}

void AuthHandler::sendPacket(uWS::WebSocket<false>* ws,
                               const PacketHeader& header,
                               const void* payload,
                               size_t size) {
    // Build packet
    std::vector<uint8_t> packet(sizeof(PacketHeader) + size);
    
    // Copy header
    std::memcpy(packet.data(), &header, sizeof(PacketHeader));
    
    // Copy payload
    if (size > 0 && payload) {
        std::memcpy(packet.data() + sizeof(PacketHeader), payload, size);
    }
    
    // Send
    ws->send(std::string_view(reinterpret_cast<char*>(packet.data()), packet.size()),
             uWS::OpCode::BINARY);
}
