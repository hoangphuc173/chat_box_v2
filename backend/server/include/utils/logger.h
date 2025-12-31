#ifndef LOGGER_H
#define LOGGER_H

#include <string>
#include <iostream>
#include <chrono>
#include <iomanip>
#include <sstream>

enum class LogLevel {
    Debug,
    Info,
    Warning,
    Error
};

class Logger {
public:
    static void setLevel(LogLevel level);
    static void debug(const std::string& message);
    static void info(const std::string& message);
    static void warning(const std::string& message);
    static void error(const std::string& message);
    
private:
    static LogLevel currentLevel;
    static void log(LogLevel level, const std::string& message);
    static std::string getCurrentTimestamp();
    static std::string levelToString(LogLevel level);
};

#endif // LOGGER_H
