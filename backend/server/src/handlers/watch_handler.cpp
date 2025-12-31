#include "handlers/watch_handler.h"
#include "pubsub/pubsub_broker.h"
#include "utils/logger.h"
#include <chrono>
#include <random>
#include <sstream>
#include <regex>

using namespace std::chrono;

WatchHandler::WatchHandler(std::shared_ptr<PubSubBroker> broker)
    : broker_(broker) {
    Logger::info("Watch handler initialized");
}

WatchHandler::~WatchHandler() {
    Logger::info("Watch handler destroyed");
}

std::string WatchHandler::generateSessionId() {
    auto now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    
    std::stringstream ss;
    ss << "watch_" << now << "_" << dis(gen);
    
    return ss.str();
}

std::string WatchHandler::extractVideoTitle(const std::string& url) {
    // Simple extraction - in real implementation, fetch from API
    if (url.find("youtube.com") != std::string::npos || 
        url.find("youtu.be") != std::string::npos) {
        return "YouTube Video";
    } else if (url.find("vimeo.com") != std::string::npos) {
        return "Vimeo Video";
    } else if (url.find("twitch.tv") != std::string::npos) {
        return "Twitch Stream";
    }
    return "Video";
}

std::string WatchHandler::formatTime(double seconds) {
    int hours = static_cast<int>(seconds) / 3600;
    int mins = (static_cast<int>(seconds) % 3600) / 60;
    int secs = static_cast<int>(seconds) % 60;
    
    std::stringstream ss;
    if (hours > 0) {
        ss << hours << ":";
    }
    ss << (mins < 10 ? "0" : "") << mins << ":"
       << (secs < 10 ? "0" : "") << secs;
    return ss.str();
}

std::string WatchHandler::startSession(const std::string& roomId,
                                        const std::string& hostId,
                                        const std::string& videoUrl) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Check if session already exists
    if (sessions_.count(roomId) > 0) {
        return "❌ There's already an active Watch Together session!\n"
               "Use `/stopwatch` to end it first.";
    }
    
    // Validate URL
    if (videoUrl.empty()) {
        return "❌ Please provide a video URL!\n"
               "Usage: `/watch <youtube-url>`";
    }
    
    // Create session
    WatchSession session;
    session.sessionId = generateSessionId();
    session.roomId = roomId;
    session.hostId = hostId;
    session.videoUrl = videoUrl;
    session.videoTitle = extractVideoTitle(videoUrl);
    session.state = PlayState::PAUSED;
    session.currentTime = 0.0;
    session.lastSyncTime = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    session.viewers.push_back(hostId);
    
    sessions_[roomId] = session;
    
    Logger::info("Watch Together started: " + session.sessionId + " in room " + roomId);
    
    std::stringstream ss;
    ss << "🎬 **Watch Together Started!**\n\n";
    ss << "📺 **" << session.videoTitle << "**\n";
    ss << "🔗 " << videoUrl << "\n\n";
    ss << "👤 Host: **" << hostId << "**\n";
    ss << "⏱️ Time: " << formatTime(0) << "\n\n";
    ss << "**Controls:**\n";
    ss << "• `/play` - Start playback\n";
    ss << "• `/pause` - Pause video\n";
    ss << "• `/seek <seconds>` - Jump to time\n";
    ss << "• `/stopwatch` - End session\n\n";
    ss << "_Everyone in the room can watch together!_";
    
    return ss.str();
}

std::string WatchHandler::play(const std::string& roomId, const std::string& userId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) == 0) {
        return "❌ No active Watch Together session!";
    }
    
    auto& session = sessions_[roomId];
    
    // Only host can control (for now)
    if (userId != session.hostId) {
        return "⚠️ Only the host (**" + session.hostId + "**) can control playback!";
    }
    
    session.state = PlayState::PLAYING;
    session.lastSyncTime = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    Logger::info("Watch Together play: " + roomId);
    
    return "▶️ **Playing** at " + formatTime(session.currentTime);
}

std::string WatchHandler::pause(const std::string& roomId, const std::string& userId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) == 0) {
        return "❌ No active Watch Together session!";
    }
    
    auto& session = sessions_[roomId];
    
    if (userId != session.hostId) {
        return "⚠️ Only the host (**" + session.hostId + "**) can control playback!";
    }
    
    session.state = PlayState::PAUSED;
    session.lastSyncTime = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    Logger::info("Watch Together pause: " + roomId);
    
    return "⏸️ **Paused** at " + formatTime(session.currentTime);
}

std::string WatchHandler::seek(const std::string& roomId, const std::string& userId, double time) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) == 0) {
        return "❌ No active Watch Together session!";
    }
    
    auto& session = sessions_[roomId];
    
    if (userId != session.hostId) {
        return "⚠️ Only the host (**" + session.hostId + "**) can seek!";
    }
    
    session.currentTime = time;
    session.lastSyncTime = duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()
    ).count();
    
    Logger::info("Watch Together seek to " + std::to_string(time) + "s: " + roomId);
    
    return "⏩ **Seeked** to " + formatTime(session.currentTime);
}

std::string WatchHandler::stopSession(const std::string& roomId, const std::string& userId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) == 0) {
        return "❌ No active Watch Together session!";
    }
    
    auto& session = sessions_[roomId];
    
    if (userId != session.hostId) {
        return "⚠️ Only the host (**" + session.hostId + "**) can end the session!";
    }
    
    std::string title = session.videoTitle;
    sessions_.erase(roomId);
    
    Logger::info("Watch Together ended: " + roomId);
    
    return "🛑 **Watch Together Ended**\n\n"
           "Thanks for watching _" + title + "_ together!";
}

std::string WatchHandler::getSessionState(const std::string& roomId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) == 0) {
        return "";
    }
    
    auto& session = sessions_[roomId];
    
    std::stringstream ss;
    ss << "🎬 **Watch Together Active**\n\n";
    ss << "📺 " << session.videoTitle << "\n";
    ss << "⏱️ " << formatTime(session.currentTime) << " | ";
    ss << (session.state == PlayState::PLAYING ? "▶️ Playing" : "⏸️ Paused") << "\n";
    ss << "👤 Host: " << session.hostId;
    
    return ss.str();
}

void WatchHandler::syncPlayback(const std::string& roomId, double currentTime) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (sessions_.count(roomId) > 0) {
        sessions_[roomId].currentTime = currentTime;
        sessions_[roomId].lastSyncTime = duration_cast<milliseconds>(
            system_clock::now().time_since_epoch()
        ).count();
    }
}

bool WatchHandler::hasActiveSession(const std::string& roomId) {
    std::lock_guard<std::mutex> lock(mutex_);
    return sessions_.count(roomId) > 0;
}

void WatchHandler::broadcastState(const WatchSession& session) {
    // Broadcast sync message to all room members
    std::stringstream ss;
    ss << "{\"type\":\"watch_sync\","
       << "\"roomId\":\"" << session.roomId << "\","
       << "\"state\":\"" << (session.state == PlayState::PLAYING ? "playing" : "paused") << "\","
       << "\"time\":" << session.currentTime << ","
       << "\"url\":\"" << session.videoUrl << "\"}";
    
    broker_->publish("room:" + session.roomId, ss.str());
}
