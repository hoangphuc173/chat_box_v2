#include "chat_client.h"
#include <iostream>
#include <string>

using namespace chatbox;

int main(int argc, char* argv[]) {
    std::cout << "========================================" << std::endl;
    std::cout << "       ChatBox C++ Client v1.0.0       " << std::endl;
    std::cout << "========================================" << std::endl;

    // Default connection settings
    std::string host = "localhost";
    int port = 8080;

    // Parse command line arguments
    if (argc > 1) {
        host = argv[1];
    }
    if (argc > 2) {
        port = std::stoi(argv[2]);
    }

    // Create client
    ChatClient client;

    // Set up callbacks
    client.onConnect([]() {
        std::cout << "[Event] Connected to server!" << std::endl;
    });

    client.onDisconnect([](const std::string& reason) {
        std::cout << "[Event] Disconnected: " << reason << std::endl;
    });

    client.onMessage([](const std::string& type, const std::string& data) {
        std::cout << "[Message] Type: " << type << std::endl;
        std::cout << "          Data: " << data << std::endl;
    });

    client.onError([](const std::string& error) {
        std::cerr << "[Error] " << error << std::endl;
    });

    // Connect to server
    std::cout << "\nConnecting to " << host << ":" << port << "..." << std::endl;
    
    if (!client.connect(host, port)) {
        std::cerr << "Failed to connect to server" << std::endl;
        return 1;
    }

    // Interactive command loop
    std::cout << "\nCommands:" << std::endl;
    std::cout << "  /login <username> <password>" << std::endl;
    std::cout << "  /register <username> <password> <email>" << std::endl;
    std::cout << "  /join <roomId>" << std::endl;
    std::cout << "  /leave <roomId>" << std::endl;
    std::cout << "  /create <roomName>" << std::endl;
    std::cout << "  /rooms" << std::endl;
    std::cout << "  /status <online|away|dnd|invisible>" << std::endl;
    std::cout << "  /msg <roomId> <message>" << std::endl;
    std::cout << "  /quit" << std::endl;
    std::cout << std::endl;

    std::string line;
    std::string currentRoom = "global";

    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        if (line[0] == '/') {
            // Parse command
            size_t space = line.find(' ');
            std::string cmd = (space != std::string::npos) ? line.substr(1, space - 1) : line.substr(1);
            std::string args = (space != std::string::npos) ? line.substr(space + 1) : "";

            if (cmd == "quit" || cmd == "exit") {
                break;
            }
            else if (cmd == "login") {
                size_t sep = args.find(' ');
                if (sep != std::string::npos) {
                    std::string username = args.substr(0, sep);
                    std::string password = args.substr(sep + 1);
                    client.login(username, password);
                } else {
                    std::cout << "Usage: /login <username> <password>" << std::endl;
                }
            }
            else if (cmd == "register") {
                // Parse: username password email
                size_t sep1 = args.find(' ');
                size_t sep2 = args.find(' ', sep1 + 1);
                if (sep1 != std::string::npos && sep2 != std::string::npos) {
                    std::string username = args.substr(0, sep1);
                    std::string password = args.substr(sep1 + 1, sep2 - sep1 - 1);
                    std::string email = args.substr(sep2 + 1);
                    client.registerUser(username, password, email);
                } else {
                    std::cout << "Usage: /register <username> <password> <email>" << std::endl;
                }
            }
            else if (cmd == "join") {
                if (!args.empty()) {
                    client.joinRoom(args);
                    currentRoom = args;
                } else {
                    std::cout << "Usage: /join <roomId>" << std::endl;
                }
            }
            else if (cmd == "leave") {
                if (!args.empty()) {
                    client.leaveRoom(args);
                } else {
                    std::cout << "Usage: /leave <roomId>" << std::endl;
                }
            }
            else if (cmd == "create") {
                if (!args.empty()) {
                    client.createRoom(args);
                } else {
                    std::cout << "Usage: /create <roomName>" << std::endl;
                }
            }
            else if (cmd == "rooms") {
                client.listRooms();
            }
            else if (cmd == "status") {
                if (!args.empty()) {
                    client.updatePresence(args);
                } else {
                    std::cout << "Usage: /status <online|away|dnd|invisible>" << std::endl;
                }
            }
            else if (cmd == "msg") {
                size_t sep = args.find(' ');
                if (sep != std::string::npos) {
                    std::string roomId = args.substr(0, sep);
                    std::string message = args.substr(sep + 1);
                    client.sendMessage(roomId, message);
                } else {
                    std::cout << "Usage: /msg <roomId> <message>" << std::endl;
                }
            }
            else {
                std::cout << "Unknown command: " << cmd << std::endl;
            }
        }
        else {
            // Send message to current room
            client.sendMessage(currentRoom, line);
        }

        // Poll for incoming messages
        client.poll();
    }

    // Cleanup
    client.disconnect();
    std::cout << "Goodbye!" << std::endl;

    return 0;
}
