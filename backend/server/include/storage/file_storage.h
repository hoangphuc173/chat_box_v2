#pragma once

#include <string>
#include <vector>
#include <optional>
#include <filesystem>
#include "database/mysql_client.h"

struct UploadedFile {
    std::string fileId;
    std::string url;
    std::string path;
    size_t size;
};

class FileStorage {
public:
    FileStorage(const std::string& uploadDir, MySQLClient& dbClient);
    
    // Upload file
    std::optional<UploadedFile> saveFile(
        const std::string& userId,
        const std::string& roomId,
        const std::string& filename,
        const std::vector<char>& data,
        const std::string& mimeType
    );
    
    // Download file
    std::optional<std::vector<char>> getFile(const std::string& fileId);
    
    // Get file metadata
    std::optional<FileInfo> getFileInfo(const std::string& fileId);
    
    // Delete file (from disk and database)
    bool deleteFile(const std::string& fileId);
    
    // Quota management
    size_t getUserStorageUsed(const std::string& userId);
    bool checkUserQuota(const std::string& userId, size_t fileSize);
    
    // Cleanup old files
    void cleanupOldFiles(int daysOld = 30);
    
private:
    std::filesystem::path uploadDir_;
    MySQLClient& dbClient_;
    
    static constexpr size_t MAX_FILE_SIZE = 10 * 1024 * 1024;  // 10MB
    static constexpr size_t USER_QUOTA = 100 * 1024 * 1024;   // 100MB
    
    std::string generateFileId();
    std::string getDatePath();
    std::string getExtension(const std::string& filename);
    std::string getMimeType(const std::string& filename);
};
