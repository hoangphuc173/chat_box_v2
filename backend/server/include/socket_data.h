#ifndef SOCKET_DATA_H
#define SOCKET_DATA_H

#include <string>

// Per-socket user data
struct PerSocketData {
    std::string sessionId;
    std::string userId;
    std::string username;
    std::string currentRoom;  // Currently joined room
    bool authenticated = false;
};

#endif // SOCKET_DATA_H
