#ifndef FILE_HANDLER_H
#define FILE_HANDLER_H

#include <memory>
#include <string>
#include "../protocol_chatbox1.h"
#include <vector>
#include <nlohmann/json.hpp>

// Forward declarations
class FileStorage;
class MySQLClient;
class PubSubBroker;
// WebSocket type erasure


/**
 * File Message Handler
 * 
 * Handles:
 * - MSG_FILE_UPLOAD - Upload file to S3
 * - MSG_FILE_DOWNLOAD - Generate download URL
 * - MSG_FILE_DELETE - Delete file from S3
 * - MSG_FILE_LIST - List files in room
 */
class FileHandler {
public:
    FileHandler(std::shared_ptr<FileStorage> fileStorage,
                std::shared_ptr<MySQLClient> dbClient,
                std::shared_ptr<PubSubBroker> broker);
    
    ~FileHandler();
    
    // Handle file messages
    void handleFileUpload(void* ws,
                          const FileUploadPayload& payload,
                          const std::vector<uint8_t>& fileData,
                          const std::string& userId,
                          const std::string& roomId);
    
    void handleFileDownload(void* ws,
                            const std::string& fileId,
                            const std::string& userId);
    
    void handleFileDelete(void* ws,
                          const std::string& fileId,
                          const std::string& userId);
    
    void handleFileList(void* ws,
                        const std::string& roomId);
    
    // Direct Upload (for large files) - simplified without S3
    void handleRequestUploadUrl(void* ws,
                                const std::string& fileName,
                                uint64_t fileSize,
                                const std::string& contentType,
                                const std::string& userId,
                                const std::string& roomId);
    
    void handleUploadNotify(void* ws,
                            const std::string& fileId,
                            const std::string& fileName,
                            uint64_t fileSize,
                            const std::string& storedPath,
                            const std::string& userId,
                            const std::string& roomId);
    
    // Chunked Upload (for very large files with local storage)
    void handleUploadInit(void* ws,
                         const nlohmann::json& data,
                         const std::string& userId,
                         const std::string& roomId);
    
    void handleUploadChunk(void* ws,
                          const nlohmann::json& data,
                          const std::string& userId);
    
    void handleUploadFinalize(void* ws,
                             const nlohmann::json& data,
                             const std::string& userId);
    
private:
    std::shared_ptr<FileStorage> fileStorage_;
    std::shared_ptr<MySQLClient> dbClient_;
    std::shared_ptr<PubSubBroker> broker_;
    
    // Helper functions
    void sendSuccess(void* ws, uint8_t messageType, const void* payload, size_t size);
    void sendError(void* ws, uint8_t messageType, const std::string& error);
    void sendPacket(void* ws, const PacketHeader& header, const void* payload, size_t size);
    
    std::string generateFileId();
    std::string generateS3FileName(const std::string& fileId, const std::string& originalName);
    void broadcastFileUploaded(const std::string& roomId, const std::string& fileId, const std::string& fileName);
    
    // Chunked upload helpers
    std::vector<uint8_t> decodeBase64(const std::string& base64);
    std::string getFileExtension(const std::string& filename);
    void broadcastFileMessage(const std::string& roomId,
                            const std::string& fileId,
                            const std::string& fileName,
                            const std::string& fileUrl,
                            uint64_t fileSize,
                            const std::string& mimeType,
                            const std::string& userId,
                            bool isVoiceMessage);
};

#endif // FILE_HANDLER_H
