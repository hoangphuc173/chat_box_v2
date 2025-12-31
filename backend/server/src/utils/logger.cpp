#include "utils/logger.h"

LogLevel Logger::currentLevel = LogLevel::Info;

void Logger::setLevel(LogLevel level) {
    currentLevel = level;
}

void Logger::debug(const std::string& message) {
    log(LogLevel::Debug, message);
}

void Logger::info(const std::string& message) {
    log(LogLevel::Info, message);
}

void Logger::warning(const std::string& message) {
    log(LogLevel::Warning, message);
}

void Logger::error(const std::string& message) {
    log(LogLevel::Error, message);
}

void Logger::log(LogLevel level, const std::string& message) {
    if (level < currentLevel) {
        return;
    }
    
    std::string timestamp = getCurrentTimestamp();
    std::string levelStr = levelToString(level);
    
    // Color codes
    const char* color = "";
    const char* reset = "\033[0m";
    
    switch (level) {
        case LogLevel::Debug:   color = "\033[36m"; break;  // Cyan
        case LogLevel::Info:    color = "\033[32m"; break;  // Green
        case LogLevel::Warning: color = "\033[33m"; break;  // Yellow
        case LogLevel::Error:   color = "\033[31m"; break;  // Red
    }
    
    std::cout << timestamp << " " << color << "[" << levelStr << "]" << reset 
              << " " << message << std::endl;
}

std::string Logger::getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    ss << '.' << std::setfill('0') << std::setw(3) << ms.count();
    
    return ss.str();
}

std::string Logger::levelToString(LogLevel level) {
    switch (level) {
        case LogLevel::Debug:   return "DEBUG";
        case LogLevel::Info:    return "INFO";
        case LogLevel::Warning: return "WARN";
        case LogLevel::Error:   return "ERROR";
        default:                return "UNKNOWN";
    }
}
