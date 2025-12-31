#ifndef BOT_HANDLER_H
#define BOT_HANDLER_H

#include <memory>
#include <string>
#include <vector>
#include <optional>
#include "../protocol_chatbox1.h"

// Forward declarations
class MySQLClient;
class PubSubBroker;


/**
 * Bot Command Handler
 * 
 * Handles slash commands:
 * - /help - Show available commands
 * - /dice - Roll a dice (1-6)
 * - /flip - Flip a coin
 * - /poll "question" "opt1" "opt2" - Create poll
 */
class BotHandler {
public:
    BotHandler(std::shared_ptr<MySQLClient> dbClient,
               std::shared_ptr<PubSubBroker> broker);
    
    ~BotHandler();
    
    // Check if message is a bot command
    bool isCommand(const std::string& content);
    
    // Parse and execute command, returns bot response message
    std::optional<std::string> handleCommand(const std::string& content,
                                              const std::string& roomId,
                                              const std::string& userId,
                                              const std::string& username);
    
private:
    std::shared_ptr<MySQLClient> dbClient_;
    std::shared_ptr<PubSubBroker> broker_;
    
    // Command handlers
    std::string handleHelp();
    std::string handleDice();
    std::string handleFlip();
    std::string handlePoll(const std::string& args, const std::string& roomId, const std::string& userId);
    
    // Parse command and arguments
    std::pair<std::string, std::string> parseCommand(const std::string& content);
};

#endif // BOT_HANDLER_H
