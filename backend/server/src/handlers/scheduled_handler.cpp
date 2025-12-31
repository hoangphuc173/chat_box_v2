#include "handlers/scheduled_handler.h"
#include "database/mysql_client.h"
#include "pubsub/pubsub_broker.h"
#include "utils/logger.h"
#include <chrono>
#include <random>
#include <sstream>
#include <regex>

using namespace std::chrono;

ScheduledHandler::ScheduledHandler(std::shared_ptr<MySQLClient> dbClient,
                                   std::shared_ptr<PubSubBroker> broker)
    : dbClient_(dbClient)
    , broker_(broker)
    , running_(false) {
    Logger::info("Scheduled handler initialized");
}

ScheduledHandler::~ScheduledHandler() {
    stopScheduler();
    Logger::info("Scheduled handler destroyed");
}

std::string ScheduledHandler::generateScheduleId() {
    auto now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    
    std::stringstream ss;
    ss << "sched_" << now << "_" << dis(gen);
    
    return ss.str();
}

std::optional<uint64_t> ScheduledHandler::parseTimeSpec(const std::string& spec) {
    std::regex timePattern("^(\\d+)([smhd])$");
    std::smatch match;
    
    if (!std::regex_match(spec, match, timePattern)) {
        return std::nullopt;
    }
    
    int value = std::stoi(match[1].str());
    char unit = match[2].str()[0];
    
    uint64_t seconds = 0;
    switch (unit) {
        case 's': seconds = value; break;
        case 'm': seconds = value * 60; break;
        case 'h': seconds = value * 3600; break;
        case 'd': seconds = value * 86400; break;
        default: return std::nullopt;
    }
    
    auto now = duration_cast<std::chrono::seconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    return now + seconds;
}

std::string ScheduledHandler::formatRelativeTime(uint64_t timestamp) {
    auto now = duration_cast<std::chrono::seconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    int64_t diff = timestamp - now;
    
    if (diff <= 0) return "now";
    if (diff < 60) return std::to_string(diff) + "s";
    if (diff < 3600) return std::to_string(diff / 60) + "m";
    if (diff < 86400) return std::to_string(diff / 3600) + "h";
    return std::to_string(diff / 86400) + "d";
}

std::string ScheduledHandler::scheduleMessage(const std::string& roomId,
                                               const std::string& userId,
                                               const std::string& username,
                                               const std::string& timeSpec,
                                               const std::string& content) {
    // Validate time
    auto scheduledTime = parseTimeSpec(timeSpec);
    if (!scheduledTime.has_value()) {
        return "❌ **Invalid time format!**\n\n"
               "Use: `<number><unit>`\n"
               "• `s` = seconds\n"
               "• `m` = minutes\n"
               "• `h` = hours\n"
               "• `d` = days\n\n"
               "Example: `/schedule 30m Reminder!`";
    }
    
    if (content.empty()) {
        return "❌ Message cannot be empty!";
    }
    
    // Create scheduled message
    ScheduledMessage msg;
    msg.scheduleId = generateScheduleId();
    msg.roomId = roomId;
    msg.userId = userId;
    msg.username = username;
    msg.content = content;
    msg.scheduledTime = scheduledTime.value();
    msg.createdAt = duration_cast<std::chrono::seconds>(
        system_clock::now().time_since_epoch()
    ).count();
    msg.sent = false;
    
    {
        std::lock_guard<std::mutex> lock(mutex_);
        pendingMessages_.push_back(msg);
    }
    
    Logger::info("Scheduled message: " + msg.scheduleId + " in " + timeSpec);
    
    std::stringstream ss;
    ss << "⏰ **Message Scheduled!**\n\n";
    ss << "📝 \"" << (content.length() > 50 ? content.substr(0, 47) + "..." : content) << "\"\n";
    ss << "⏱️ Will be sent in **" << timeSpec << "**\n";
    ss << "🆔 ID: `" << msg.scheduleId << "`\n\n";
    ss << "_Use `/cancelschedule " << msg.scheduleId << "` to cancel._";
    
    return ss.str();
}

std::string ScheduledHandler::listScheduledMessages(const std::string& userId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<ScheduledMessage> userMessages;
    for (const auto& msg : pendingMessages_) {
        if (msg.userId == userId && !msg.sent) {
            userMessages.push_back(msg);
        }
    }
    
    if (userMessages.empty()) {
        return "📭 You have no scheduled messages.";
    }
    
    std::stringstream ss;
    ss << "⏰ **Your Scheduled Messages**\n\n";
    
    for (const auto& msg : userMessages) {
        ss << "• `" << msg.scheduleId << "` - ";
        ss << "\"" << (msg.content.length() > 30 ? msg.content.substr(0, 27) + "..." : msg.content) << "\" ";
        ss << "in " << formatRelativeTime(msg.scheduledTime) << "\n";
    }
    
    return ss.str();
}

std::string ScheduledHandler::cancelScheduledMessage(const std::string& scheduleId,
                                                      const std::string& userId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    for (auto it = pendingMessages_.begin(); it != pendingMessages_.end(); ++it) {
        if (it->scheduleId == scheduleId) {
            if (it->userId != userId) {
                return "❌ You can only cancel your own messages!";
            }
            pendingMessages_.erase(it);
            Logger::info("Cancelled scheduled message: " + scheduleId);
            return "✅ Scheduled message cancelled!";
        }
    }
    
    return "❌ Scheduled message not found!";
}

void ScheduledHandler::startScheduler() {
    if (running_) return;
    
    running_ = true;
    schedulerThread_ = std::thread(&ScheduledHandler::schedulerLoop, this);
    Logger::info("Scheduler thread started");
}

void ScheduledHandler::stopScheduler() {
    running_ = false;
    if (schedulerThread_.joinable()) {
        schedulerThread_.join();
    }
    Logger::info("Scheduler thread stopped");
}

void ScheduledHandler::schedulerLoop() {
    while (running_) {
        auto now = duration_cast<std::chrono::seconds>(
            system_clock::now().time_since_epoch()
        ).count();
        
        std::vector<ScheduledMessage> toSend;
        
        {
            std::lock_guard<std::mutex> lock(mutex_);
            for (auto& msg : pendingMessages_) {
                if (!msg.sent && msg.scheduledTime <= static_cast<uint64_t>(now)) {
                    msg.sent = true;
                    toSend.push_back(msg);
                }
            }
            
            // Remove sent messages
            pendingMessages_.erase(
                std::remove_if(pendingMessages_.begin(), pendingMessages_.end(),
                    [](const ScheduledMessage& m) { return m.sent; }),
                pendingMessages_.end()
            );
        }
        
        // Send messages outside of lock
        for (const auto& msg : toSend) {
            sendScheduledMessage(msg);
        }
        
        // Sleep for 10 seconds
        std::this_thread::sleep_for(std::chrono::seconds(10));
    }
}

void ScheduledHandler::sendScheduledMessage(const ScheduledMessage& msg) {
    std::stringstream content;
    content << "⏰ **Scheduled Message from " << msg.username << "**\n\n";
    content << msg.content;
    
    // Create JSON notification for PubSub
    std::stringstream ss;
    ss << "{\"type\":\"scheduled_message\","
       << "\"roomId\":\"" << msg.roomId << "\","
       << "\"userId\":\"" << msg.userId << "\","
       << "\"username\":\"" << msg.username << "\","
       << "\"content\":\"" << content.str() << "\"}";
    
    broker_->publish("room:" + msg.roomId, ss.str());
    
    Logger::info("Sent scheduled message: " + msg.scheduleId);
}
