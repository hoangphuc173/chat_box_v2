#ifndef PROTOCOL_CHATBOX1_H
#define PROTOCOL_CHATBOX1_H

#include <cstdint>
#include <cstring>
#include <string>
#include <vector>

// ============================================================================
// CHATBOX1 PROTOCOL - Advanced Chat System
// Version: 1.0
// Description: Complete protocol for production chat system with DynamoDB + S3
// ============================================================================

// ============================================================================
// CONSTANTS & LIMITS
// ============================================================================

#define PROTOCOL_VERSION 1
#define DEFAULT_PORT 8080  // WebSocket port
#define MAX_BUFFER_SIZE 8192
#define MAX_TOPIC_LEN 128
#define MAX_USERNAME_LEN 64
#define MAX_MESSAGE_LEN 4096
#define MAX_FILENAME_LEN 256
#define MAX_ROOM_NAME_LEN 128

// File transfer
#define CHUNK_SIZE (1024 * 1024)  // 1MB chunks
#define MAX_FILE_SIZE (100 * 1024 * 1024)  // 100MB max

// Packet magic number for validation
#define PACKET_MAGIC 0x43484154  // "CHAT" in ASCII

// Alias for backward compatibility with websocket_server.cpp
#define MSG_AUTH_LOGIN MSG_LOGIN_REQUEST
#define MSG_AUTH_REGISTER MSG_REGISTER_REQUEST

// ============================================================================
// MESSAGE TYPES
// ============================================================================

enum MessageType : uint32_t {
    // ===== AUTHENTICATION (1-19) =====
    MSG_REGISTER_REQUEST = 1,
    MSG_REGISTER_RESPONSE,
    MSG_LOGIN_REQUEST,
    MSG_LOGIN_RESPONSE,
    MSG_LOGOUT,
    MSG_HEARTBEAT,              // Keep-alive ping
    MSG_SESSION_EXPIRED,
    MSG_2FA_CHALLENGE,
    MSG_2FA_RESPONSE,
    
    // ===== PUB/SUB CORE (20-39) =====
    MSG_SUBSCRIBE = 20,
    MSG_UNSUBSCRIBE,
    MSG_PUBLISH,
    MSG_SUB_ACK,
    MSG_UNSUB_ACK,
    MSG_PUBLISH_ACK,
    
    // ===== CHAT MESSAGES (40-69) =====
    MSG_CHAT_TEXT = 40,
    MSG_CHAT_IMAGE,
    MSG_CHAT_VIDEO,
    MSG_CHAT_AUDIO,
    MSG_CHAT_FILE,
    MSG_CHAT_STICKER,
    MSG_CHAT_LOCATION,
    MSG_CHAT_CONTACT,
    
    MSG_EDIT_MESSAGE,
    MSG_DELETE_MESSAGE,
    MSG_REPLY_MESSAGE,
    MSG_FORWARD_MESSAGE,
    
    MSG_TYPING_START,
    MSG_TYPING_STOP,
    MSG_MESSAGE_READ,
    MSG_MESSAGE_DELIVERED,
    
    // ===== ROOMS/GROUPS (70-89) =====
    MSG_CREATE_ROOM = 70,
    MSG_JOIN_ROOM,
    MSG_LEAVE_ROOM,
    MSG_INVITE_USER,
    MSG_KICK_USER,
    MSG_ROOM_INFO_REQUEST,
    MSG_ROOM_INFO_RESPONSE,
    MSG_UPDATE_ROOM_SETTINGS,
    MSG_PIN_MESSAGE,
    MSG_UNPIN_MESSAGE,
    
    // ===== REACTIONS (90-99) =====
    MSG_ADD_REACTION = 90,
    MSG_REMOVE_REACTION,
    MSG_REACTION_UPDATE,
    
    // ===== FILE TRANSFER (100-119) =====
    MSG_FILE_INIT = 100,
    MSG_FILE_CHUNK,
    MSG_FILE_COMPLETE,
    MSG_FILE_ERROR,
    MSG_FILE_REQUEST,
    MSG_FILE_CANCEL,
    MSG_FILE_PROGRESS,
    
    // ===== VOICE/VIDEO CALLS - WebRTC Signaling (120-139) =====
    MSG_CALL_INIT = 120,
    MSG_CALL_OFFER,             // SDP offer
    MSG_CALL_ANSWER,            // SDP answer
    MSG_CALL_ICE_CANDIDATE,     // ICE candidate
    MSG_CALL_ACCEPT,
    MSG_CALL_REJECT,
    MSG_CALL_HANGUP,
    MSG_CALL_MUTE_AUDIO,
    MSG_CALL_UNMUTE_AUDIO,
    MSG_CALL_MUTE_VIDEO,
    MSG_CALL_UNMUTE_VIDEO,
    
    // ===== GAMES (140-159) =====
    MSG_GAME_INVITE = 140,
    MSG_GAME_ACCEPT,
    MSG_GAME_REJECT,
    MSG_GAME_MOVE,              // Player makes a move
    MSG_GAME_STATE,             // Current game state
    MSG_GAME_END,
    MSG_GAME_FORFEIT,
    
    // ===== WATCH TOGETHER (160-179) =====
    MSG_WATCH_CREATE = 160,
    MSG_WATCH_JOIN,
    MSG_WATCH_LEAVE,
    MSG_WATCH_PLAY,
    MSG_WATCH_PAUSE,
    MSG_WATCH_SEEK,
    MSG_WATCH_SYNC,             // Sync current time
    MSG_WATCH_END,
    
    // ===== POLLS (180-189) =====
    MSG_POLL_CREATE = 180,
    MSG_POLL_VOTE,
    MSG_POLL_CLOSE,
    MSG_POLL_RESULT,
    
    // ===== WORKFLOWS (190-199) =====
    MSG_WORKFLOW_CREATE = 190,
    MSG_WORKFLOW_UPDATE,
    MSG_WORKFLOW_DELETE,
    MSG_WORKFLOW_TRIGGER,
    MSG_WORKFLOW_EXECUTE,
    
    // ===== AI BOT (200-219) =====
    MSG_AI_REQUEST = 200,
    MSG_AI_RESPONSE,
    MSG_AI_TYPING,
    MSG_AI_ERROR,
    
    // ===== PRESENCE (220-229) =====
    MSG_PRESENCE_UPDATE = 220,  // User online/offline/away
    MSG_PRESENCE_REQUEST,
    MSG_PRESENCE_RESPONSE,
    
    // ===== USER MANAGEMENT (230-249) =====
    MSG_USER_PROFILE_REQUEST = 230,
    MSG_USER_PROFILE_RESPONSE,
    MSG_USER_PROFILE_UPDATE,
    MSG_USER_SEARCH,
    MSG_USER_BLOCK,
    MSG_USER_UNBLOCK,
    
    // ===== SYSTEM (250-255) =====
    MSG_ERROR = 250,
    MSG_ACK,
    MSG_NACK,
    MSG_PING,
    MSG_PONG
};

// ============================================================================
// USER STATUS
// ============================================================================

enum UserStatus : uint8_t {
    STATUS_OFFLINE = 0,
    STATUS_ONLINE,
    STATUS_AWAY,
    STATUS_DND,         // Do Not Disturb
    STATUS_INVISIBLE
};

// ============================================================================
// ROOM TYPES
// ============================================================================

enum RoomType : uint8_t {
    ROOM_PRIVATE = 0,   // 1-1 chat
    ROOM_GROUP,         // Group chat
    ROOM_CHANNEL        // Broadcast channel
};

// ============================================================================
// FILE TYPES
// ============================================================================

enum FileType : uint8_t {
    FILE_IMAGE = 0,
    FILE_VIDEO,
    FILE_AUDIO,
    FILE_DOCUMENT,
    FILE_ARCHIVE,
    FILE_OTHER
};

// ============================================================================
// GAME TYPES
// ============================================================================

enum GameType : uint8_t {
    GAME_TIC_TAC_TOE = 0,
    GAME_CHESS,
    GAME_CHECKERS
};

// ============================================================================
// PACKET HEADER (Common for all messages)
// ============================================================================

#pragma pack(push, 1)
struct PacketHeader {
    uint32_t msgType;           // MessageType
    uint32_t payloadLength;     // Length of the payload following this header
    uint32_t messageId;         // Unique message ID (for ACK/tracking)
    uint64_t timestamp;         // Unix timestamp (milliseconds)
    uint8_t version;            // Protocol version
    uint8_t flags;              // Bit flags (encrypted, compressed, etc.)
    char sender[MAX_USERNAME_LEN];  // Sender's username or userId
    char topic[MAX_TOPIC_LEN];      // Pub/Sub topic
    uint32_t checksum;          // CRC32 for integrity
};
#pragma pack(pop)

// Header flags
#define FLAG_ENCRYPTED  0x01
#define FLAG_COMPRESSED 0x02
#define FLAG_PRIORITY   0x04
#define FLAG_REQUIRE_ACK 0x08

// ============================================================================
// PAYLOAD STRUCTURES
// ============================================================================

// ----- Authentication -----
#pragma pack(push, 1)
struct RegisterPayload {
    char username[MAX_USERNAME_LEN];
    char passwordHash[64];      // bcrypt hash
    char email[128];
};

struct LoginPayload {
    char username[MAX_USERNAME_LEN];
    char passwordHash[64];
};

struct LoginResponse {
    uint8_t success;
    char token[256];            // JWT token
    char userId[64];
    char errorMessage[256];
};
#pragma pack(pop)

// ----- Chat Messages -----
#pragma pack(push, 1)
struct ChatTextPayload {
    char roomId[64];
    char messageId[64];
    char replyToId[64];         // If replying to another message
    uint16_t messageLen;
    // Followed by: char message[messageLen]
};

struct ChatFilePayload {
    char roomId[64];
    char messageId[64];
    char fileId[64];
    char filename[MAX_FILENAME_LEN];
    uint64_t fileSize;
    uint8_t fileType;           // FileType enum
    char caption[512];
};
#pragma pack(pop)

// ----- File Transfer -----
#pragma pack(push, 1)
struct FileInitPayload {
    char transferId[64];
    char filename[MAX_FILENAME_LEN];
    uint64_t totalSize;
    uint32_t totalChunks;
    uint8_t fileType;
    char recipientId[MAX_USERNAME_LEN];  // For 1-1 file transfer
};

struct FileUploadPayload {
    char filename[MAX_FILENAME_LEN];
    uint64_t fileSize;
    char contentType[64];
};

struct FileChunkPayload {
    char transferId[64];
    uint32_t chunkIndex;
    uint32_t chunkSize;
    // Followed by: uint8_t data[chunkSize]
};

struct FileCompletePayload {
    char transferId[64];
    char s3Url[512];            // S3 URL of uploaded file
};
#pragma pack(pop)

// ----- Reactions -----
#pragma pack(push, 1)
struct ReactionPayload {
    char messageId[64];
    char emoji[16];             // UTF-8 emoji
    uint8_t action;             // 0=remove, 1=add
};
#pragma pack(pop)

// ----- Games -----
#pragma pack(push, 1)
struct GameInvitePayload {
    char gameId[64];
    uint8_t gameType;           // GameType enum
    char opponentId[MAX_USERNAME_LEN];
};

struct GameMovePayload {
    char gameId[64];
    uint8_t row;
    uint8_t col;
    char boardState[256];       // JSON or serialized board
};
#pragma pack(pop)

// ----- Watch Together -----
#pragma pack(push, 1)
struct WatchSyncPayload {
    char sessionId[64];
    char videoUrl[512];
    uint64_t currentTime;       // Milliseconds
    uint8_t isPlaying;
};
#pragma pack(pop)

// ----- Polls -----
#pragma pack(push, 1)
struct PollCreatePayload {
    char pollId[64];
    char roomId[64];
    char question[512];
    uint8_t optionCount;
    // Followed by: char options[optionCount][256]
};

struct PollVotePayload {
    char pollId[64];
    uint8_t optionIndex;
};
#pragma pack(pop)

// ----- WebRTC Signaling -----
#pragma pack(push, 1)
struct CallOfferPayload {
    char callId[64];
    char calleeId[MAX_USERNAME_LEN];
    uint16_t sdpLength;
    // Followed by: char sdp[sdpLength]
};

struct CallAnswerPayload {
    char callId[64];
    uint16_t sdpLength;
    // Followed by: char sdp[sdpLength]
};

struct CallIceCandidatePayload {
    char callId[64];
    uint16_t candidateLength;
    // Followed by: char candidate[candidateLength]
};
#pragma pack(pop)

// ----- AI Bot -----
#pragma pack(push, 1)
struct AIRequestPayload {
    char conversationId[64];
    uint16_t promptLength;
    // Followed by: char prompt[promptLength]
};

struct AIResponsePayload {
    char conversationId[64];
    uint16_t responseLength;
    // Followed by: char response[responseLength]
};
#pragma pack(pop)

// ----- Presence -----
#pragma pack(push, 1)
struct PresencePayload {
    char userId[MAX_USERNAME_LEN];
    uint8_t status;             // UserStatus enum
    char statusMessage[256];
};
#pragma pack(pop)

// ----- Error/ACK -----
#pragma pack(push, 1)
struct ErrorPayload {
    uint32_t errorCode;
    char errorMessage[512];
};

struct AckPayload {
    uint32_t ackedMessageId;
    uint8_t success;
};
#pragma pack(pop)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

namespace ProtocolChatBox1 {
    // Calculate CRC32 checksum
    uint32_t calculateChecksum(const void* data, size_t length);
    
    // Verify packet integrity
    bool verifyPacket(const PacketHeader* header);
    
    // Create packet header
    PacketHeader createHeader(MessageType type, const char* sender, 
                            const char* topic, uint32_t payloadLen);
    
    // Serialize/Deserialize helpers
    std::vector<uint8_t> serializePacket(const PacketHeader& header, 
                                        const void* payload, size_t payloadSize);
    
    bool deserializePacket(const std::vector<uint8_t>& data, 
                          PacketHeader& header, std::vector<uint8_t>& payload);
}

// ============================================================================
// PUB/SUB TOPIC NAMING CONVENTION
// ============================================================================

/*
 * Topic Format:
 * 
 * chat.private.{userId1}.{userId2}     - Private 1-1 chat
 * chat.group.{roomId}                  - Group chat
 * presence.{userId}                    - User presence updates
 * file.transfer.{transferId}           - File transfer
 * game.{gameId}                        - Game UserSession
 * watch.{sessionId}                    - Watch together UserSession
 * call.{callId}                        - Voice/Video call signaling
 * poll.{pollId}                        - Poll updates
 * workflow.{workflowId}                - Workflow execution
 * ai.{conversationId}                  - AI conversation
 * 
 * System topics:
 * system.broadcast                     - Server broadcasts
 * system.notifications.{userId}        - User-specific notifications
 */

#endif // PROTOCOL_CHATBOX1_H
