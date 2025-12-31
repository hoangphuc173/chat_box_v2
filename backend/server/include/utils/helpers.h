// Backend optimization utilities

#pragma once

#include <string>
#include <vector>
#include <functional>
#include <memory>

namespace chatbox {
namespace utils {

/**
 * String utilities for common operations
 */
class StringUtils {
public:
    // Trim whitespace
    static std::string trim(const std::string& str);
    
    // Split string by delimiter
    static std::vector<std::string> split(const std::string& str, char delimiter);
    
    // Join strings
    static std::string join(const std::vector<std::string>& strings, const std::string& delimiter);
    
    // Case conversion
    static std::string toLower(const std::string& str);
    static std::string toUpper(const std::string& str);
    
    // Check if string starts/ends with
    static bool startsWith(const std::string& str, const std::string& prefix);
    static bool endsWith(const std::string& str, const std::string& suffix);
    
    // Replace all occurrences
    static std::string replaceAll(const std::string& str, const std::string& from, const std::string& to);
};

/**
 * JSON utilities for safe parsing
 */
class JsonUtils {
public:
    // Safe string extraction
    static std::string getString(const std::string& json, const std::string& key, const std::string& defaultValue = "");
    
    // Safe number extraction
    static int getInt(const std::string& json, const std::string& key, int defaultValue = 0);
    static long getLong(const std::string& json, const std::string& key, long defaultValue = 0);
    
    // Safe boolean extraction  
    static bool getBool(const std::string& json, const std::string& key, bool defaultValue = false);
    
    // Create simple JSON
    static std::string createObject(const std::vector<std::pair<std::string, std::string>>& fields);
    static std::string createArray(const std::vector<std::string>& items);
};

/**
 * Time utilities
 */
class TimeUtils {
public:
    // Get current timestamp in milliseconds
    static long long getCurrentTimestamp();
    
    // Format timestamp to ISO 8601
    static std::string formatTimestamp(long long timestamp);
    
    // Parse ISO 8601 to timestamp
    static long long parseTimestamp(const std::string& iso8601);
};

/**
 * Security utilities
 */
class SecurityUtils {
public:
    // Generate random string
    static std::string generateRandomString(size_t length);
    
    // Generate UUID
    static std::string generateUUID();
    
    // Validate email format
    static bool isValidEmail(const std::string& email);
    
    // Sanitize user input
    static std::string sanitizeInput(const std::string& input);
};

} // namespace utils
} // namespace chatbox
