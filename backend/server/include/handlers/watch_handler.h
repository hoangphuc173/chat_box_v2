#ifndef WATCH_HANDLER_H
#define WATCH_HANDLER_H

#include <memory>
#include <string>
#include <unordered_map>
#include <mutex>
#include <vector>

class PubSubBroker;

/**
 * Watch Together Handler
 * 
 * Enables synchronized video watching across room members.
 * 
 * Features:
 * - Start a watch session with a video URL
 * - Sync play/pause/seek across all viewers
 * - Host controls (play, pause, seek)
 * - Late joiner sync
 * 
 * Commands:
 * - /watch <youtube-url> - Start watching
 * - /pause - Pause playback
 * - /play - Resume playback
 * - /seek <time> - Seek to timestamp
 * - /stopwatch - End session
 */
class WatchHandler {
public:
    enum class PlayState {
        PLAYING,
        PAUSED,
        ENDED
    };
    
    struct WatchSession {
        std::string sessionId;
        std::string roomId;
        std::string hostId;
        std::string videoUrl;
        std::string videoTitle;
        PlayState state;
        double currentTime;        // In seconds
        uint64_t lastSyncTime;     // Timestamp of last sync
        std::vector<std::string> viewers;
    };
    
    WatchHandler(std::shared_ptr<PubSubBroker> broker);
    ~WatchHandler();
    
    // Start a new watch session
    std::string startSession(const std::string& roomId,
                              const std::string& hostId,
                              const std::string& videoUrl);
    
    // Player controls
    std::string play(const std::string& roomId, const std::string& userId);
    std::string pause(const std::string& roomId, const std::string& userId);
    std::string seek(const std::string& roomId, const std::string& userId, double time);
    
    // End session
    std::string stopSession(const std::string& roomId, const std::string& userId);
    
    // Get current state for late joiners
    std::string getSessionState(const std::string& roomId);
    
    // Sync heartbeat (updates current time)
    void syncPlayback(const std::string& roomId, double currentTime);
    
    // Check if room has active session
    bool hasActiveSession(const std::string& roomId);
    
private:
    std::shared_ptr<PubSubBroker> broker_;
    std::unordered_map<std::string, WatchSession> sessions_; // roomId -> session
    std::mutex mutex_;
    
    std::string generateSessionId();
    void broadcastState(const WatchSession& session);
    std::string extractVideoTitle(const std::string& url);
    std::string formatTime(double seconds);
};

#endif // WATCH_HANDLER_H
