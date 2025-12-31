#include "pubsub/pubsub_broker.h"
#include "utils/logger.h"
#include <algorithm>

PubSubBroker::PubSubBroker() {
    Logger::info("PubSub broker initialized");
}

PubSubBroker::~PubSubBroker() {
    std::lock_guard<std::mutex> lock(mutex_);
    topics_.clear();
    subscriberTopics_.clear();
    Logger::info("PubSub broker destroyed");
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

bool PubSubBroker::subscribe(const std::string& subscriberId,
                              const std::string& topic,
                              MessageCallback callback) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    try {
        // Create subscriber
        auto subscriber = std::make_shared<Subscriber>(subscriberId, std::move(callback));
        
        // Add to topic's subscriber list
        topics_[topic].push_back(subscriber);
        
        // Track subscriber's topics
        subscriberTopics_[subscriberId].insert(topic);
        
        Logger::debug("Subscribed: " + subscriberId + " -> " + topic);
        return true;
        
    } catch (const std::exception& e) {
        Logger::error("Subscribe failed: " + std::string(e.what()));
        return false;
    }
}

bool PubSubBroker::unsubscribe(const std::string& subscriberId, const std::string& topic) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    try {
        // Remove from topic's subscriber list
        auto topicIt = topics_.find(topic);
        if (topicIt != topics_.end()) {
            auto& subscribers = topicIt->second;
            
            subscribers.erase(
                std::remove_if(subscribers.begin(), subscribers.end(),
                    [&subscriberId](const std::shared_ptr<Subscriber>& sub) {
                        return sub->subscriberId == subscriberId;
                    }),
                subscribers.end()
            );
            
            // Remove topic if no subscribers left
            if (subscribers.empty()) {
                topics_.erase(topicIt);
            }
        }
        
        // Remove from subscriber's topic list
        auto subIt = subscriberTopics_.find(subscriberId);
        if (subIt != subscriberTopics_.end()) {
            subIt->second.erase(topic);
            
            // Remove subscriber entry if no topics left
            if (subIt->second.empty()) {
                subscriberTopics_.erase(subIt);
            }
        }
        
        Logger::debug("Unsubscribed: " + subscriberId + " <- " + topic);
        return true;
        
    } catch (const std::exception& e) {
        Logger::error("Unsubscribe failed: " + std::string(e.what()));
        return false;
    }
}

void PubSubBroker::unsubscribeAll(const std::string& subscriberId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    try {
        // Get all topics for this subscriber
        auto subIt = subscriberTopics_.find(subscriberId);
        if (subIt == subscriberTopics_.end()) {
            return;  // Not subscribed to anything
        }
        
        auto topics = subIt->second;  // Copy to avoid iterator invalidation
        
        // Unlock temporarily to call unsubscribe (which locks internally)
        // Actually, we're already locked, so manually remove
        for (const auto& topic : topics) {
            auto topicIt = topics_.find(topic);
            if (topicIt != topics_.end()) {
                auto& subscribers = topicIt->second;
                
                subscribers.erase(
                    std::remove_if(subscribers.begin(), subscribers.end(),
                        [&subscriberId](const std::shared_ptr<Subscriber>& sub) {
                            return sub->subscriberId == subscriberId;
                        }),
                    subscribers.end()
                );
                
                if (subscribers.empty()) {
                    topics_.erase(topicIt);
                }
            }
        }
        
        subscriberTopics_.erase(subIt);
        
        Logger::info("Unsubscribed all: " + subscriberId + " (" + std::to_string(topics.size()) + " topics)");
        
    } catch (const std::exception& e) {
        Logger::error("Unsubscribe all failed: " + std::string(e.what()));
    }
}

std::vector<std::string> PubSubBroker::getSubscribers(const std::string& topic) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<std::string> result;
    
    auto it = topics_.find(topic);
    if (it != topics_.end()) {
        for (const auto& sub : it->second) {
            result.push_back(sub->subscriberId);
        }
    }
    
    return result;
}

std::vector<std::string> PubSubBroker::getSubscribedTopics(const std::string& subscriberId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    std::vector<std::string> result;
    
    auto it = subscriberTopics_.find(subscriberId);
    if (it != subscriberTopics_.end()) {
        result.assign(it->second.begin(), it->second.end());
    }
    
    return result;
}

// ============================================================================
// MESSAGE PUBLISHING
// ============================================================================

void PubSubBroker::publish(const std::string& topic,
                            const std::string& message,
                            const std::string& senderId) {
    std::vector<std::shared_ptr<Subscriber>> subscribers;
    
    {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = topics_.find(topic);
        if (it != topics_.end()) {
            subscribers = it->second;  // Copy to avoid holding lock during callbacks
        }
    }
    
    if (subscribers.empty()) {
        Logger::debug("No subscribers for topic: " + topic);
        return;
    }
    
    // Call callbacks outside of lock to avoid deadlock
    for (const auto& sub : subscribers) {
        try {
            // Don't send message back to sender (optional filtering)
            if (!senderId.empty() && sub->subscriberId == senderId) {
                continue;
            }
            
            sub->callback(topic, message, senderId);
            
        } catch (const std::exception& e) {
            Logger::error("Callback error for " + sub->subscriberId + ": " + e.what());
        }
    }
    
    Logger::debug("Published to " + topic + ": " + std::to_string(subscribers.size()) + " recipients");
}

void PubSubBroker::publishToRoom(const std::string& roomId,
                                  const std::string& message,
                                  const std::string& senderId) {
    std::string topic = makeRoomTopic(roomId);
    publish(topic, message, senderId);
}

void PubSubBroker::publishToUser(const std::string& userId,
                                  const std::string& message,
                                  const std::string& senderId) {
    std::string topic = makeUserTopic(userId);
    publish(topic, message, senderId);
}

void PubSubBroker::broadcast(const std::string& message, const std::string& senderId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Collect all unique subscribers
    std::unordered_set<std::string> uniqueSubscribers;
    for (const auto& [topic, subscribers] : topics_) {
        for (const auto& sub : subscribers) {
            if (senderId.empty() || sub->subscriberId != senderId) {
                uniqueSubscribers.insert(sub->subscriberId);
            }
        }
    }
    
    Logger::info("Broadcasting to " + std::to_string(uniqueSubscribers.size()) + " subscribers");
    
    // Publish to broadcast topic (or implement differently)
    publish("broadcast", message, senderId);
}

// ============================================================================
// STATISTICS
// ============================================================================

size_t PubSubBroker::getTopicCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return topics_.size();
}

size_t PubSubBroker::getSubscriberCount() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return subscriberTopics_.size();
}

size_t PubSubBroker::getTotalSubscriptions() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    size_t total = 0;
    for (const auto& [topic, subscribers] : topics_) {
        total += subscribers.size();
    }
    return total;
}

void PubSubBroker::printStats() const {
    std::lock_guard<std::mutex> lock(mutex_);
    
    Logger::info("=== PubSub Broker Stats ===");
    Logger::info("Topics: " + std::to_string(topics_.size()));
    Logger::info("Subscribers: " + std::to_string(subscriberTopics_.size()));
    Logger::info("Total subscriptions: " + std::to_string(getTotalSubscriptions()));
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

std::string PubSubBroker::makeRoomTopic(const std::string& roomId) const {
    return "room:" + roomId;
}

std::string PubSubBroker::makeUserTopic(const std::string& userId) const {
    return "user:" + userId;
}
