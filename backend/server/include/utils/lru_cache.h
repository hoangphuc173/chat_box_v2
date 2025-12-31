#ifndef LRU_CACHE_H
#define LRU_CACHE_H

#include <list>
#include <unordered_map>
#include <mutex>
#include <optional>

template<typename Key, typename Value>
class LRUCache {
public:
    explicit LRUCache(size_t capacity) : capacity_(capacity) {}

    void put(const Key& key, const Value& value) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        // Remove existing item if present
        auto it = cacheMap_.find(key);
        if (it != cacheMap_.end()) {
            cacheList_.erase(it->second);
            cacheMap_.erase(it);
        }

        // Insert new item at front
        cacheList_.push_front({key, value});
        cacheMap_[key] = cacheList_.begin();

        // Evict if over capacity
        if (cacheMap_.size() > capacity_) {
            auto last = cacheList_.back();
            cacheMap_.erase(last.first);
            cacheList_.pop_back();
        }
    }

    std::optional<Value> get(const Key& key) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = cacheMap_.find(key);
        if (it == cacheMap_.end()) {
            return std::nullopt;
        }

        // Move access item to front
        cacheList_.splice(cacheList_.begin(), cacheList_, it->second);
        return it->second->second;
    }

    void remove(const Key& key) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = cacheMap_.find(key);
        if (it != cacheMap_.end()) {
            cacheList_.erase(it->second);
            cacheMap_.erase(it);
        }
    }

    void clear() {
        std::lock_guard<std::mutex> lock(mutex_);
        cacheList_.clear();
        cacheMap_.clear();
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return cacheMap_.size();
    }

private:
    size_t capacity_;
    std::list<std::pair<Key, Value>> cacheList_;
    std::unordered_map<Key, typename std::list<std::pair<Key, Value>>::iterator> cacheMap_;
    mutable std::mutex mutex_;
};

#endif // LRU_CACHE_H
