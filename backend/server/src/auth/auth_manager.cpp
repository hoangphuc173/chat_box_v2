#include "auth/auth_manager.h"
#include "auth/jwt_handler.h"
#include "utils/logger.h"
#include <openssl/sha.h>
#include <random>
#include <sstream>
#include <iomanip>
#include <chrono>

// Real Authentication implementation với OpenSSL SHA256

AuthManager::AuthManager(std::shared_ptr<MySQLClient> db,
                         const std::string& jwtSecret,
                         int jwtExpirySeconds)
    : db_(db), jwtSecret_(jwtSecret), jwtExpiry_(jwtExpirySeconds) {
    Logger::info("✓ AuthManager initialized với OpenSSL SHA256 + JWT");
}

bool AuthManager::registerUser(const UserRegistration& reg) {
    try {
        // Check if username exists
        auto existing = db_->getUser(reg.username);
        if (existing) {
            Logger::warning("Register failed: username đã tồn tại: " + reg.username);
            return false;
        }
        
        // Hash password với SHA256
        std::string passwordHash = hashPassword(reg.password);
        
        // Create user
        User newUser;
        newUser.userId = generateSessionId();
        newUser.username = reg.username;
        newUser.email = reg.email;
        newUser.passwordHash = passwordHash;
        newUser.status = STATUS_OFFLINE;
        newUser.statusMessage = "";
        newUser.createdAt = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        
        bool created = db_->createUser(newUser);
        if (created) {
            Logger::info("✓ User đăng ký thành công: " + reg.username);
        }
        
        return created;
        
    } catch (const std::exception& e) {
        Logger::error("Register error: " + std::string(e.what()));
        return false;
    }
}

LoginResult AuthManager::login(const std::string& username, const std::string& password) {
    LoginResult result;
    result.success = false;
    
    try {
        // Get user from database
        auto userOpt = db_->getUser(username);
        if (!userOpt) {
            result.errorMessage = "Sai username hoặc password";
            Logger::warning("Login failed: user không tồn tại: " + username);
            return result;
        }
        
        User user = *userOpt;
        
        // Verify password
        std::string inputHash = hashPassword(password);
        if (inputHash != user.passwordHash) {
            result.errorMessage = "Sai username hoặc password";
            Logger::warning("Login failed: sai password cho: " + username);
            return result;
        }
        
        // Generate JWT token
        std::string token = generateToken(user.userId, user.username);
        if (token.empty()) {
            result.errorMessage = "Không thể tạo token";
            Logger::error("Login failed: token generation error");
            return result;
        }
        
        // Create session in database
        UserSession session;
        session.sessionId = generateSessionId();
        session.userId = user.userId;
        session.username = user.username;
        session.createdAt = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        session.expiresAt = session.createdAt + jwtExpiry_;
        
        db_->createSession(session);
        
        // Success!
        result.success = true;
        result.token = token;
        result.userId = user.userId;
        
        Logger::info("✓ User đăng nhập: " + username);
        return result;
        
    } catch (const std::exception& e) {
        result.errorMessage = "Lỗi hệ thống";
        Logger::error("Login error: " + std::string(e.what()));
        return result;
    }
}

void AuthManager::logout(const std::string& sessionId) {
    db_->deleteSession(sessionId);
    Logger::info("User đăng xuất: session " + sessionId);
}

bool AuthManager::validateToken(const std::string& token) {
    return JWTHandler::verify(token, jwtSecret_);
}

std::optional<SessionInfo> AuthManager::getSessionFromToken(const std::string& token) {
    try {
        auto claims = JWTHandler::decode(token, jwtSecret_);
        if (claims.empty()) {
            return std::nullopt;
        }
        
        SessionInfo info;
        info.sessionId = claims["sid"];
        info.userId = claims["sub"];
        info.username = claims["username"];
        info.expiresAt = std::stoull(claims["exp"]);
        
        return info;
        
    } catch (const std::exception&) {
        return std::nullopt;
    }
}

bool AuthManager::createSession(const std::string& userId, const std::string& username) {
    try {
        UserSession session;
        session.sessionId = generateSessionId();
        session.userId = userId;
        session.username = username;
        session.createdAt = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        session.expiresAt = session.createdAt + jwtExpiry_;
        
        return db_->createSession(session);
        
    } catch (const std::exception& e) {
        Logger::error("Create session error: " + std::string(e.what()));
        return false;
    }
}

void AuthManager::updateSessionHeartbeat(const std::string& sessionId) {
    auto now = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    db_->updateSessionHeartbeat(sessionId, now);
}

bool AuthManager::updateAvatar(const std::string& userId, const std::string& avatarUrl) {
    return db_->updateUserAvatar(userId, avatarUrl);
}

void AuthManager::cleanupExpiredSessions() {
    // TODO: Implement cleanup
    Logger::info("Session cleanup - TODO");
}

// Private helper methods

std::string AuthManager::generateToken(const std::string& userId, const std::string& username) {
    try {
        auto now = std::chrono::system_clock::now();
        auto exp = now + std::chrono::seconds(jwtExpiry_);
        
        std::map<std::string, std::string> claims;
        claims["sub"] = userId;
        claims["username"] = username;
        claims["sid"] = generateSessionId();
        claims["iat"] = std::to_string(std::chrono::system_clock::to_time_t(now));
        claims["exp"] = std::to_string(std::chrono::system_clock::to_time_t(exp));
        
        return JWTHandler::create(claims, jwtSecret_);
        
    } catch (const std::exception& e) {
        Logger::error("Token generation error: " + std::string(e.what()));
        return "";
    }
}

std::string AuthManager::generateSessionId() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    const char* hex = "0123456789abcdef";
    std::stringstream ss;
    
    for (int i = 0; i < 32; i++) {
        ss << hex[dis(gen)];
        if (i == 7 || i == 11 || i == 15 || i == 19) {
            ss << '-';
        }
    }
    
    return ss.str();
}

std::string AuthManager::hashPassword(const std::string& password) {
    // SHA256 hash với salt
    unsigned char hash[SHA256_DIGEST_LENGTH];
    std::string salted = "chatbox_salt_" + password + "_2024";  // Simple salt
    
    SHA256((unsigned char*)salted.c_str(), salted.length(), hash);
    
    // Convert to hex string
    std::stringstream ss;
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    
    return ss.str();
}

bool AuthManager::verifyPassword(const std::string& password, const std::string& hash) {
    return hashPassword(password) == hash;
}
