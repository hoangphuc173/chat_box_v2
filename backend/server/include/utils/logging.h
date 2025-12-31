// Logging and monitoring utilities

#pragma once

#include <string>
#include <sstream>
#include <chrono>
#include <map>

namespace chatbox {
namespace logging {

/**
 * Log levels
 */
enum class LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL
};

/**
 * Simple logger with structured output
 */
class Logger {
public:
    static void debug(const std::string& message, const std::map<std::string, std::string>& context = {});
    static void info(const std::string& message, const std::map<std::string, std::string>& context = {});
    static void warning(const std::string& message, const std::map<std::string, std::string>& context = {});
    static void error(const std::string& message, const std::map<std::string, std::string>& context = {});
    static void critical(const std::string& message, const std::map<std::string, std::string>& context = {});
    
    static void setLevel(LogLevel level);
    static LogLevel getLevel();
    
private:
    static void log(LogLevel level, const std::string& message, const std::map<std::string, std::string>& context);
    static std::string levelToString(LogLevel level);
    static LogLevel currentLevel;
};

/**
 * Performance monitoring
 */
class PerformanceMonitor {
public:
    class Timer {
    public:
        Timer(const std::string& name);
        ~Timer();
        void stop();
        
    private:
        std::string name;
        std::chrono::high_resolution_clock::time_point start;
        bool stopped = false;
    };
    
    static void recordDuration(const std::string& operation, long long durationMs);
    static void recordCount(const std::string& metric, int count = 1);
    static void recordGauge(const std::string& metric, double value);
    static std::string getMetrics();
};

/**
 * Structured log builders
 */
class LogBuilder {
public:
    LogBuilder& withUser(const std::string& userId);
    LogBuilder& withRoom(const std::string& roomId);
    LogBuilder& withMessage(const std::string& messageId);
    LogBuilder& withError(const std::string& error);
    LogBuilder& withDuration(long long durationMs);
    LogBuilder& withCustom(const std::string& key, const std::string& value);
    
    void debug(const std::string& message);
    void info(const std::string& message);
    void warning(const std::string& message);
    void error(const std::string& message);
    
private:
    std::map<std::string, std::string> context;
};

// Convenience macros for automatic context
#define LOG_DEBUG(msg) chatbox::logging::Logger::debug(msg, {{"file", __FILE__}, {"line", std::to_string(__LINE__)}})
#define LOG_INFO(msg) chatbox::logging::Logger::info(msg, {{"file", __FILE__}, {"line", std::to_string(__LINE__)}})
#define LOG_WARNING(msg) chatbox::logging::Logger::warning(msg, {{"file", __FILE__}, {"line", std::to_string(__LINE__)}})
#define LOG_ERROR(msg) chatbox::logging::Logger::error(msg, {{"file", __FILE__}, {"line", std::to_string(__LINE__)}})

// Performance timing macro
#define PERF_TIMER(name) chatbox::logging::PerformanceMonitor::Timer __perf_timer(name)

} // namespace logging
} // namespace chatbox
