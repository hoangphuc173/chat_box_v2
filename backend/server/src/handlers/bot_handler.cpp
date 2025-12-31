#include "handlers/bot_handler.h"
#include "database/mysql_client.h"
#include "pubsub/pubsub_broker.h"
#include "utils/logger.h"
#include <random>
#include <sstream>
#include <chrono>
#include <regex>

BotHandler::BotHandler(std::shared_ptr<MySQLClient> dbClient,
                       std::shared_ptr<PubSubBroker> broker)
    : dbClient_(dbClient)
    , broker_(broker) {
    Logger::info("Bot handler initialized with commands: /help, /dice, /flip, /poll");
}

BotHandler::~BotHandler() {
    Logger::info("Bot handler destroyed");
}

bool BotHandler::isCommand(const std::string& content) {
    return !content.empty() && content[0] == '/';
}

std::pair<std::string, std::string> BotHandler::parseCommand(const std::string& content) {
    // Find first space to separate command from args
    size_t spacePos = content.find(' ');
    
    if (spacePos == std::string::npos) {
        // No arguments
        return {content.substr(1), ""}; // Remove leading /
    }
    
    std::string command = content.substr(1, spacePos - 1);
    std::string args = content.substr(spacePos + 1);
    
    return {command, args};
}

std::optional<std::string> BotHandler::handleCommand(const std::string& content,
                                                      const std::string& roomId,
                                                      const std::string& userId,
                                                      const std::string& username) {
    auto [command, args] = parseCommand(content);
    
    Logger::info("Bot command: /" + command + " from " + username);
    
    if (command == "help") {
        return handleHelp();
    } else if (command == "dice" || command == "roll") {
        return handleDice();
    } else if (command == "flip" || command == "coin") {
        return handleFlip();
    } else if (command == "poll") {
        return handlePoll(args, roomId, userId);
    } else {
        return "❓ Unknown command: /" + command + "\nType /help for available commands.";
    }
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

std::string BotHandler::handleHelp() {
    return "🤖 **Available Commands**\n\n"
           "**🎲 Fun**\n"
           "• `/dice` - Roll a dice 🎲\n"
           "• `/flip` - Flip a coin 🪙\n"
           "• `/poll \"Q?\" \"A\" \"B\"` - Create poll\n\n"
           "**🎮 Games**\n"
           "• `/game ttt @user` - Tic-Tac-Toe\n"
           "• `/move <r> <c>` - Make move\n"
           "• `/resign` - Quit game\n\n"
           "**🎬 Watch Together**\n"
           "• `/watch <url>` - Start session\n"
           "• `/play` `/pause` `/seek <s>`\n"
           "• `/stopwatch` - End session\n\n"
           "**⏰ Schedule**\n"
           "• `/schedule 10m msg` - Send later\n"
           "• `/schedules` - List pending\n"
           "• `/cancelschedule <id>`\n\n"
           "**🤖 AI**\n"
           "• `@ai <question>` - Ask AI";
}

std::string BotHandler::handleDice() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1, 6);
    
    int result = dis(gen);
    
    // Dice face emojis
    const char* diceFaces[] = {"", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"};
    
    std::stringstream ss;
    ss << "🎲 **Dice Roll**\n\n";
    ss << "You rolled: " << diceFaces[result] << " **" << result << "**";
    
    return ss.str();
}

std::string BotHandler::handleFlip() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 1);
    
    bool isHeads = dis(gen) == 1;
    
    std::stringstream ss;
    ss << "🪙 **Coin Flip**\n\n";
    ss << "Result: " << (isHeads ? "**HEADS** 👑" : "**TAILS** 🦅");
    
    return ss.str();
}

std::string BotHandler::handlePoll(const std::string& args, 
                                    const std::string& roomId, 
                                    const std::string& userId) {
    // Parse poll format: "Question?" "Option 1" "Option 2" ...
    std::regex optionPattern("\"([^\"]+)\"");
    
    std::vector<std::string> parts;
    auto begin = std::sregex_iterator(args.begin(), args.end(), optionPattern);
    auto end = std::sregex_iterator();
    
    for (std::sregex_iterator i = begin; i != end; ++i) {
        std::smatch match = *i;
        parts.push_back(match[1].str());
    }
    
    if (parts.size() < 3) {
        return "❌ **Invalid Poll Format**\n\n"
               "Usage: `/poll \"Your question?\" \"Option 1\" \"Option 2\"`\n"
               "Example: `/poll \"Best programming language?\" \"Python\" \"JavaScript\" \"C++\"`";
    }
    
    std::string question = parts[0];
    
    std::stringstream ss;
    ss << "📊 **Poll**\n\n";
    ss << "**" << question << "**\n\n";
    
    // Number emojis for options
    const char* numbers[] = {"1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"};
    
    for (size_t i = 1; i < parts.size() && i <= 10; ++i) {
        ss << numbers[i-1] << " " << parts[i] << "\n";
    }
    
    ss << "\n_React with the corresponding number to vote!_";
    
    // TODO: Save poll to database for tracking votes
    // For now, just display the poll
    
    Logger::info("Poll created in room " + roomId + ": " + question);
    
    return ss.str();
}
