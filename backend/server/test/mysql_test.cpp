#include <iostream>
#include "database/mysql_client.h"
#include "utils/logger.h"
#include "config/config_loader.h"

int main() {
    Logger::info("=== MySQL Connection Test ===");
    
    try {
        // Load config
        Config config = ConfigLoader::load("C:/Users/ADMIN/Downloads/ChatBox web/config/.env");
        Logger::info("✓ Config loaded!");
        
        // Create MySQL client 
        // Note: mysqlx uses port 33070 on this MySQL instance
        MySQLClient db(config.mysqlHost, config.mysqlUser, 
                      config.mysqlPassword, config.mysqlDatabase,
                      33070);  // X Protocol port
        
        Logger::info("Connecting to MySQL X DevAPI...");
        if (db.connect()) {
            Logger::info("✓ MySQL connected successfully!");
            
            // Test: Create a user
            User testUser;
            testUser.userId = "test-001";
            testUser.username = "testuser";
            testUser.email = "test@example.com";
            testUser.passwordHash = "hashed_password_here";
            testUser.status = UserStatus::STATUS_ONLINE;
            testUser.statusMessage = "Testing!";
            
            if (db.createUser(testUser)) {
                Logger::info("✓ Test user created!");
                
                // Try to get it back
                auto user = db.getUser("testuser");
                if (user) {
                    Logger::info("✓ User retrieved: " + user->username);
                    Logger::info("  Email: " + user->email);
                    Logger::info("  Status: " + std::to_string(static_cast<int>(user->status)));
                }
            }
            
            Logger::info("");
            Logger::info("✅ MySQL integration working!");
            
            return 0;
        } else {
            Logger::error("✗ MySQL connection failed!");
            Logger::info("");
            Logger::info("Note: MySQL X Plugin must be enabled");
            Logger::info("Run: INSTALL PLUGIN mysqlx SONAME 'mysqlx.so';");
            return 1;
        }
        
    } catch (const std::exception& e) {
        Logger::error("Exception: " + std::string(e.what()));
        return 1;
    }
}
