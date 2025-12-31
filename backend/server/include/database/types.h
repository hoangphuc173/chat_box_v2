#pragma once

#include <string>
#include <cstdint>
#include <vector>
#include "../protocol_chatbox1.h"  // For UserStatus and common types

// User structure
struct User {
    std::string userId;
    std::string username;
    std::string email;
    std::string passwordHash;
    std::string avatarUrl; // New field for local avatar
    uint64_t createdAt;
    UserStatus status;  // From protocol_chatbox1.h
    std::string statusMessage;
};

// UserSession structure (renamed from UserSession to avoid mysqlx::Session conflict)
struct UserSession {
    std::string sessionId;
    std::string userId;
    std::string username;
    uint64_t createdAt;
    uint64_t expiresAt;
};

// Message structure
struct Message {
    std::string messageId;
    std::string roomId;
    std::string senderId;
    std::string senderName;
    std::string content;
    uint32_t messageType;
    std::string replyToId;
    uint64_t timestamp;
    std::string metadata;  // JSON string for file attachments, voice, etc.
};

// Room structure
struct Room {
    std::string roomId;
    std::string name;
    std::string creatorId;
    std::vector<std::string> memberIds;
};

// File info structure
struct FileInfo {
    std::string fileId;
    std::string userId;
    std::string roomId;
    std::string filename;
    std::string s3Key;  // Reused as stored_path for local
    uint64_t fileSize;
    std::string mimeType;
    uint64_t uploadedAt;
};

// Poll option structure
struct PollOption {
    std::string optionId;
    std::string text;
    int index;
    int voteCount = 0;
    std::vector<std::string> voterIds;
    std::vector<std::string> voterNames;
};

// Poll structure
struct Poll {
    std::string pollId;
    std::string roomId;
    std::string question;
    std::string createdBy;
    uint64_t createdAt;
    bool isClosed = false;
    std::vector<PollOption> options;
};

// Poll vote structure
struct PollVote {
    std::string pollId;
    std::string optionId;
    std::string userId;
    std::string username;
};
