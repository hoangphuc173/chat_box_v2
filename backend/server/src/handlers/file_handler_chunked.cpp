// Chunked Upload Handler Extension for FileHandler
// Supports very large files with local storage

#include "handlers/file_handler.h"
#include "utils/logger.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <regex>

namespace fs = std::filesystem;

// ============================================================================
// CHUNKED UPLOAD SESSION MANAGEMENT
// ============================================================================

struct UploadSession {
    std::string uploadId;
    std::string fileName;
    uint64_t fileSize;
    std::string mimeType;
    uint32_t chunkSize;
    uint32_t totalChunks;
    uint32_t chunksReceived;
    std::string tempDir;
    std::string userId;
    std::string roomId;
    long long createdAt;
};

// Store active upload sessions (in-memory, could be moved to Redis for production)
static std::unordered_map<std::string, UploadSession> activeUploads;
static std::mutex uploadsMutex;

// Local storage directory
const std::string UPLOADS_DIR = "./uploads";
const std::string TEMP_UPLOADS_DIR = "./uploads/temp";

// ============================================================================
// CHUNKED UPLOAD: INIT
// ============================================================================

void FileHandler::handleUploadInit(uWS::WebSocket<false>* ws,
                                     const nlohmann::json& data,
                                     const std::string& userId,
                                     const std::string& roomId) {
    try {
        // Parse request
        std::string fileName = data["fileName"];
        uint64_t fileSize = data["fileSize"];
        std::string mimeType = data.value("mimeType", "application/octet-stream");
        uint32_t chunkSize = data.value("chunkSize", 1048576); // 1MB default
        uint32_t totalChunks = data["totalChunks"];

        // Generate upload ID
        std::string uploadId = generateFileId();
        
        // Create temp directory for this upload
        std::string tempDir = TEMP_UPLOADS_DIR + "/" + uploadId;
        fs::create_directories(tempDir);

        // Create upload session
        UploadSession session;
        session.uploadId = uploadId;
        session.fileName = fileName;
        session.fileSize = fileSize;
        session.mimeType = mimeType;
        session.chunkSize = chunkSize;
        session.totalChunks = totalChunks;
        session.chunksReceived = 0;
        session.tempDir = tempDir;
        session.userId = userId;
        session.roomId = roomId;
        session.createdAt = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();

        // Store session
        {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            activeUploads[uploadId] = session;
        }

        Logger::info("Upload session created: " + uploadId + " for file: " + fileName + 
                    " (" + std::to_string(fileSize / (1024 * 1024)) + " MB)");

        // Send ready response
        nlohmann::json response = {
            {"type", "upload_ready"},
            {"uploadId", uploadId},
            {"chunkSize", chunkSize},
            {"totalChunks", totalChunks}
        };

        ws->send(response.dump(), uWS::OpCode::TEXT);

    } catch (const std::exception& e) {
        Logger::error("Upload init failed: " + std::string(e.what()));
        
        nlohmann::json error = {
            {"type", "upload_error"},
            {"message", e.what()}
        };
        ws->send(error.dump(), uWS::OpCode::TEXT);
    }
}

// ============================================================================
// CHUNKED UPLOAD: CHUNK
// ============================================================================

void FileHandler::handleUploadChunk(uWS::WebSocket<false>* ws,
                                      const nlohmann::json& data,
                                      const std::string& userId) {
    try {
        std::string uploadId = data["uploadId"];
        uint32_t chunkIndex = data["chunkIndex"];
        std::string chunkData = data["chunkData"]; // Base64 encoded
        uint32_t totalChunks = data["totalChunks"];

        // Get upload session
        UploadSession* session = nullptr;
        {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            auto it = activeUploads.find(uploadId);
            if (it == activeUploads.end()) {
                throw std::runtime_error("Upload session not found");
            }
            session = &it->second;

            // Verify user
            if (session->userId != userId) {
                throw std::runtime_error("Unauthorized");
            }
        }

        // Decode Base64 chunk
        std::vector<uint8_t> chunkBytes = decodeBase64(chunkData);

        // Save chunk to temp file
        std::string chunkPath = session->tempDir + "/chunk_" + std::to_string(chunkIndex);
        std::ofstream chunkFile(chunkPath, std::ios::binary);
        if (!chunkFile) {
            throw std::runtime_error("Failed to create chunk file");
        }
        chunkFile.write(reinterpret_cast<const char*>(chunkBytes.data()), chunkBytes.size());
        chunkFile.close();

        // Update session
        {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            session->chunksReceived++;
        }

        // Calculate progress
        int progress = (session->chunksReceived * 100) / session->totalChunks;

        Logger::debug("Chunk " + std::to_string(chunkIndex) + "/" + 
                     std::to_string(totalChunks) + " received (" + 
                     std::to_string(progress) + "%)");

        // Send progress update
        nlohmann::json response = {
            {"type", "upload_progress"},
            {"uploadId", uploadId},
            {"chunksReceived", session->chunksReceived},
            {"totalChunks", totalChunks},
            {"progress", progress}
        };

        ws->send(response.dump(), uWS::OpCode::TEXT);

    } catch (const std::exception& e) {
        Logger::error("Upload chunk failed: " + std::string(e.what()));
        
        nlohmann::json error = {
            {"type", "upload_error"},
            {"uploadId", data.value("uploadId", "")},
            {"message", e.what()}
        };
        ws->send(error.dump(), uWS::OpCode::TEXT);
    }
}

// ============================================================================
// CHUNKED UPLOAD: FINALIZE
// ============================================================================

void FileHandler::handleUploadFinalize(uWS::WebSocket<false>* ws,
                                         const nlohmann::json& data,
                                         const std::string& userId) {
    try {
        std::string uploadId = data["uploadId"];

        // Get upload session
        UploadSession session;
        {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            auto it = activeUploads.find(uploadId);
            if (it == activeUploads.end()) {
                throw std::runtime_error("Upload session not found");
            }
            session = it->second;

            // Verify user
            if (session.userId != userId) {
                throw std::runtime_error("Unauthorized");
            }

            // Verify all chunks received
            if (session.chunksReceived != session.totalChunks) {
                throw std::runtime_error("Missing chunks: " + 
                    std::to_string(session.chunksReceived) + "/" + 
                    std::to_string(session.totalChunks));
            }
        }

        Logger::info("Assembling file: " + session.fileName + " from " + 
                    std::to_string(session.totalChunks) + " chunks");

        // Create final uploads directory
        fs::create_directories(UPLOADS_DIR);

        // Generate final file path
        std::string fileId = generateFileId();
        std::string extension = getFileExtension(session.fileName);
        std::string finalFileName = fileId + extension;
        std::string finalPath = UPLOADS_DIR + "/" + finalFileName;

        // Assemble chunks into final file
        std::ofstream finalFile(finalPath, std::ios::binary);
        if (!finalFile) {
            throw std::runtime_error("Failed to create final file");
        }

        for (uint32_t i = 0; i < session.totalChunks; i++) {
            std::string chunkPath = session.tempDir + "/chunk_" + std::to_string(i);
            std::ifstream chunkFile(chunkPath, std::ios::binary);
            if (!chunkFile) {
                throw std::runtime_error("Missing chunk: " + std::to_string(i));
            }

            // Copy chunk to final file
            finalFile << chunkFile.rdbuf();
            chunkFile.close();
        }
        finalFile.close();

        // Clean up temp directory
        fs::remove_all(session.tempDir);

        // Remove from active uploads
        {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            activeUploads.erase(uploadId);
        }

        Logger::info("File assembled successfully: " + finalPath);

        // Generate file URL (local path)
        std::string fileUrl = "/uploads/" + finalFileName;

        // Save to database (optional)
        // saveFileMetadata(fileId, session.fileName, session.fileSize, session.mimeType, fileUrl);

        // Detect if voice message
        bool isVoiceMessage = session.mimeType.find("audio/") == 0;

        // Send completion response
        nlohmann::json response = {
            {"type", "upload_complete"},
            {"uploadId", uploadId},
            {"fileId", fileId},
            {"fileUrl", fileUrl},
            {"fileName", session.fileName},
            {"fileSize", session.fileSize},
            {"mimeType", session.mimeType},
            {"isVoice", isVoiceMessage}
        };

        ws->send(response.dump(), uWS::OpCode::TEXT);

        // Broadcast file to room
        broadcastFileMessage(session.roomId, fileId, session.fileName, 
                           fileUrl, session.fileSize, session.mimeType,
                           session.userId, isVoiceMessage);

    } catch (const std::exception& e) {
        Logger::error("Upload finalize failed: " + std::string(e.what()));
        
        // Clean up on error
        try {
            std::lock_guard<std::mutex> lock(uploadsMutex);
            auto it = activeUploads.find(uploadId);
            if (it != activeUploads.end()) {
                fs::remove_all(it->second.tempDir);
                activeUploads.erase(it);
            }
        } catch (...) {}

        nlohmann::json error = {
            {"type", "upload_error"},
            {"uploadId", uploadId},
            {"message", e.what()}
        };
        ws->send(error.dump(), uWS::OpCode::TEXT);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

std::vector<uint8_t> FileHandler::decodeBase64(const std::string& base64) {
    static const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";

    std::vector<uint8_t> result;
    int val = 0, valb = -8;
    
    for (unsigned char c : base64) {
        if (c == '=') break;
        if (base64_chars.find(c) == std::string::npos) continue;
        
        val = (val << 6) + base64_chars.find(c);
        valb += 6;
        if (valb >= 0) {
            result.push_back((val >> valb) & 0xFF);
            valb -= 8;
        }
    }
    
    return result;
}

std::string FileHandler::getFileExtension(const std::string& filename) {
    size_t pos = filename.find_last_of('.');
    if (pos != std::string::npos) {
        return filename.substr(pos);
    }
    return "";
}

void FileHandler::broadcastFileMessage(const std::string& roomId,
                                        const std::string& fileId,
                                        const std::string& fileName,
                                        const std::string& fileUrl,
                                        uint64_t fileSize,
                                        const std::string& mimeType,
                                        const std::string& userId,
                                        bool isVoiceMessage) {
    try {
        nlohmann::json message = {
            {"type", "chat"},
            {"messageId", generateFileId()},
            {"roomId", roomId},
            {"userId", userId},
            {"content", isVoiceMessage ? "🎤 Voice Message" : ("📎 " + fileName)},
            {"timestamp", std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch()
            ).count()},
            {"messageType", isVoiceMessage ? "voice" : "file"},
            {"metadata", {
                {"fileId", fileId},
                {"fileName", fileName},
                {"fileUrl", fileUrl},
                {"fileSize", fileSize},
                {"mimeType", mimeType}
            }}
        };

        // Broadcast to room via PubSub
        if (broker_) {
            broker_->publish(roomId, message.dump());
        }

        Logger::info("Broadcasted " + std::string(isVoiceMessage ? "voice" : "file") + 
                    " message to room: " + roomId);

    } catch (const std::exception& e) {
        Logger::error("Failed to broadcast file message: " + std::string(e.what()));
    }
}
