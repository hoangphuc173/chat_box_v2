#ifndef SCHEDULED_HANDLER_H
#define SCHEDULED_HANDLER_H

#include <memory>
#include <string>
#include <vector>
#include <mutex>
#include <thread>
#include <atomic>
#include <chrono>

class MySQLClient;
class PubSubBroker;

/**
 * Scheduled Messages Handler
 * 
 * Allows users to schedule messages to be sent at a future time.
 * 
 * Commands:
 * - /schedule <time> <message> - Schedule a message
 *   Examples:
 *   - /schedule 10m Hello!     - In 10 minutes
 *   - /schedule 2h Meeting!    - In 2 hours
 *   - /schedule 1d Reminder    - In 1 day
 * 
 * - /schedules - List pending scheduled messages
 * - /cancelschedule <id> - Cancel a scheduled message
 */
class ScheduledHandler {
public:
    struct ScheduledMessage {
        std::string scheduleId;
        std::string roomId;
        std::string userId;
        std::string username;
        std::string content;
        uint64_t scheduledTime;   // Unix timestamp
        uint64_t createdAt;
        bool sent;
    };
    
    ScheduledHandler(std::shared_ptr<MySQLClient> dbClient,
                     std::shared_ptr<PubSubBroker> broker);
    ~ScheduledHandler();
    
    // Schedule a new message
    std::string scheduleMessage(const std::string& roomId,
                                 const std::string& userId,
                                 const std::string& username,
                                 const std::string& timeSpec,
                                 const std::string& content);
    
    // List pending scheduled messages for a user
    std::string listScheduledMessages(const std::string& userId);
    
    // Cancel a scheduled message
    std::string cancelScheduledMessage(const std::string& scheduleId,
                                        const std::string& userId);
    
    // Start the scheduler thread (checks every minute)
    void startScheduler();
    void stopScheduler();
    
private:
    std::shared_ptr<MySQLClient> dbClient_;
    std::shared_ptr<PubSubBroker> broker_;
    
    std::vector<ScheduledMessage> pendingMessages_;
    std::mutex mutex_;
    
    std::thread schedulerThread_;
    std::atomic<bool> running_;
    
    // Parse time specification (10m, 2h, 1d)
    std::optional<uint64_t> parseTimeSpec(const std::string& spec);
    
    // Send a scheduled message
    void sendScheduledMessage(const ScheduledMessage& msg);
    
    // Scheduler loop
    void schedulerLoop();
    
    std::string generateScheduleId();
    std::string formatRelativeTime(uint64_t timestamp);
};

#endif // SCHEDULED_HANDLER_H
