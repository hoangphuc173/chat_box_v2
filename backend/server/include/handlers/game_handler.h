#ifndef GAME_HANDLER_H
#define GAME_HANDLER_H

#include <memory>
#include <string>
#include <unordered_map>
#include <mutex>
#include "../game/tictactoe.h"

/**
 * Game Handler
 * 
 * Manages active games in chat rooms.
 * 
 * Commands:
 * - /game ttt @opponent - Start Tic-Tac-Toe with opponent
 * - /move <row> <col> - Make a move in current game
 * - /resign - Resign from current game
 */
class GameHandler {
public:
    struct GameSession {
        std::string gameId;
        std::string roomId;
        std::string playerX;
        std::string playerO;
        TicTacToe game;
        uint64_t startedAt;
    };
    
    GameHandler();
    ~GameHandler();
    
    // Start a new Tic-Tac-Toe game
    std::string startTicTacToe(const std::string& roomId, 
                                const std::string& player1, 
                                const std::string& player2);
    
    // Make a move in an active game
    std::string makeMove(const std::string& gameId,
                          const std::string& playerId,
                          int row, int col);
    
    // Resign from a game
    std::string resignGame(const std::string& gameId, const std::string& playerId);
    
    // Get game status as formatted string
    std::string getGameStatus(const std::string& gameId);
    
    // Get active game in a room (if any)
    std::string getActiveGameInRoom(const std::string& roomId);
    
    // Render board as ASCII art for chat
    static std::string renderBoard(const TicTacToe& game);
    
private:
    std::unordered_map<std::string, GameSession> games_;
    std::unordered_map<std::string, std::string> roomToGame_; // roomId -> gameId
    std::mutex mutex_;
    
    std::string generateGameId();
};

#endif // GAME_HANDLER_H
