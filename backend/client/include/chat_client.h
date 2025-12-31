#pragma once

#include <string>
#include <functional>
#include <memory>
#include <queue>
#include <mutex>
#include <thread>
#include <atomic>

namespace chatbox {

// Connection state
enum class ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Authenticated
};

// Event callbacks
using OnConnectCallback = std::function<void()>;
using OnDisconnectCallback = std::function<void(const std::string& reason)>;
using OnMessageCallback = std::function<void(const std::string& type, const std::string& data)>;
using OnErrorCallback = std::function<void(const std::string& error)>;

/**
 * @brief ChatBox WebSocket Client
 * 
 * A C++ client library for connecting to the ChatBox WebSocket server.
 * Provides async networking with callback-based event handling.
 */
class ChatClient {
public:
    ChatClient();
    ~ChatClient();

    // Connection
    bool connect(const std::string& host, int port);
    void disconnect();
    bool isConnected() const;
    ConnectionState getState() const;

    // Authentication
    bool login(const std::string& username, const std::string& password);
    bool registerUser(const std::string& username, const std::string& password, const std::string& email);
    void setToken(const std::string& token);

    // Messaging
    void sendMessage(const std::string& roomId, const std::string& content);
    void editMessage(const std::string& messageId, const std::string& content);
    void deleteMessage(const std::string& messageId);
    void addReaction(const std::string& messageId, const std::string& emoji);

    // Rooms
    void joinRoom(const std::string& roomId);
    void leaveRoom(const std::string& roomId);
    void createRoom(const std::string& name);
    void listRooms();

    // Presence
    void updatePresence(const std::string& status);
    void sendTyping(const std::string& roomId, bool isTyping);

    // Callbacks
    void onConnect(OnConnectCallback callback);
    void onDisconnect(OnDisconnectCallback callback);
    void onMessage(OnMessageCallback callback);
    void onError(OnErrorCallback callback);

    // Event loop (call from main thread)
    void poll();
    void run();  // Blocking run loop
    void stop();

private:
    struct Impl;
    std::unique_ptr<Impl> pImpl;
};

} // namespace chatbox
