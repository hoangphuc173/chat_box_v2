#ifndef PUBSUB_BROKER_H
#define PUBSUB_BROKER_H

#include <string>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <mutex>
#include <memory>
#include <vector>

// Message callback type
// Args: (topic, message data, sender ID)
using MessageCallback = std::function<void(const std::string&, const std::string&, const std::string&)>;

// Subscriber info
struct Subscriber {
    std::string subscriberId;
    MessageCallback callback;
    
    Subscriber(const std::string& id, MessageCallback cb)
        : subscriberId(id), callback(std::move(cb)) {}
};

/**
 * Pub/Sub Broker for real-time message routing
 * 
 * Features:
 * - Topic-based subscriptions
 * - Room-based message routing
 * - User-to-user direct messaging
 * - Wildcard subscriptions (optional)
 */
class PubSubBroker {
public:
    PubSubBroker();
    ~PubSubBroker();
    
    // ========================================================================
    // SUBSCRIPTION MANAGEMENT
    // ========================================================================
    
    /**
     * Subscribe to a topic
     * @param subscriberId Unique subscriber ID (usually sessionId)
     * @param topic Topic to subscribe to (e.g., "room:123", "user:456")
     * @param callback Function to call when message arrives
     */
    bool subscribe(const std::string& subscriberId, 
                   const std::string& topic,
                   MessageCallback callback);
    
    /**
     * Unsubscribe from a topic
     */
    bool unsubscribe(const std::string& subscriberId, const std::string& topic);
    
    /**
     * Unsubscribe from all topics (e.g., when user disconnects)
     */
    void unsubscribeAll(const std::string& subscriberId);
    
    /**
     * Get all subscribers for a topic
     */
    std::vector<std::string> getSubscribers(const std::string& topic);
    
    /**
     * Get all topics a subscriber is subscribed to
     */
    std::vector<std::string> getSubscribedTopics(const std::string& subscriberId);
    
    // ========================================================================
    // MESSAGE PUBLISHING
    // ========================================================================
    
    /**
     * Publish message to a topic
     * @param topic Topic to publish to
     * @param message Message data (JSON string or binary)
     * @param senderId ID of sender (for filtering)
     */
    void publish(const std::string& topic, 
                 const std::string& message,
                 const std::string& senderId = "");
    
    /**
     * Publish to room (broadcasts to all room subscribers)
     */
    void publishToRoom(const std::string& roomId, 
                       const std::string& message,
                       const std::string& senderId = "");
    
    /**
     * Publish to specific user (direct message)
     */
    void publishToUser(const std::string& userId,
                       const std::string& message,
                       const std::string& senderId = "");
    
    /**
     * Broadcast to all connected clients
     */
    void broadcast(const std::string& message, const std::string& senderId = "");
    
    // ========================================================================
    // STATISTICS
    // ========================================================================
    
    size_t getTopicCount() const;
    size_t getSubscriberCount() const;
    size_t getTotalSubscriptions() const;
    
    void printStats() const;
    
private:
    // Topic -> List of subscribers
    std::unordered_map<std::string, std::vector<std::shared_ptr<Subscriber>>> topics_;
    
    // SubscriberId -> List of topics they're subscribed to
    std::unordered_map<std::string, std::unordered_set<std::string>> subscriberTopics_;
    
    // Thread safety
    mutable std::mutex mutex_;
    
    // Helper functions
    std::string makeRoomTopic(const std::string& roomId) const;
    std::string makeUserTopic(const std::string& userId) const;
};

#endif // PUBSUB_BROKER_H
