#include "handlers/game_handler.h"
#include "utils/logger.h"
#include <chrono>
#include <random>
#include <sstream>

using namespace std::chrono;

GameHandler::GameHandler() {
    Logger::info("Game handler initialized");
}

GameHandler::~GameHandler() {
    Logger::info("Game handler destroyed");
}

std::string GameHandler::generateGameId() {
    auto now = duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
    
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    
    std::stringstream ss;
    ss << "game_" << now << "_" << dis(gen);
    
    return ss.str();
}

std::string GameHandler::startTicTacToe(const std::string& roomId,
                                         const std::string& player1,
                                         const std::string& player2) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    // Check if there's already an active game in this room
    if (roomToGame_.count(roomId) > 0) {
        return "❌ There's already an active game in this room! Use `/resign` to end it.";
    }
    
    // Create new game
    GameSession session;
    session.gameId = generateGameId();
    session.roomId = roomId;
    session.playerX = player1;
    session.playerO = player2;
    session.game.reset();
    session.startedAt = duration_cast<seconds>(system_clock::now().time_since_epoch()).count();
    
    games_[session.gameId] = session;
    roomToGame_[roomId] = session.gameId;
    
    Logger::info("Started Tic-Tac-Toe: " + session.gameId + " (" + player1 + " vs " + player2 + ")");
    
    std::stringstream ss;
    ss << "🎮 **Tic-Tac-Toe Started!**\n\n";
    ss << "👤 **X**: " << player1 << "\n";
    ss << "👤 **O**: " << player2 << "\n\n";
    ss << renderBoard(session.game) << "\n\n";
    ss << "**" << player1 << "** goes first! Use `/move <row> <col>` (1-3)\n";
    ss << "_Example: `/move 1 2` for top-middle_";
    
    return ss.str();
}

std::string GameHandler::makeMove(const std::string& gameId,
                                   const std::string& playerId,
                                   int row, int col) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (games_.count(gameId) == 0) {
        return "❌ Game not found!";
    }
    
    auto& session = games_[gameId];
    
    // Determine which player
    TicTacToe::Player player;
    if (playerId == session.playerX) {
        player = TicTacToe::Player::X;
    } else if (playerId == session.playerO) {
        player = TicTacToe::Player::O;
    } else {
        return "❌ You're not a player in this game!";
    }
    
    // Check if it's their turn
    if (session.game.getCurrentPlayer() != player) {
        std::string opponent = (player == TicTacToe::Player::X) ? session.playerO : session.playerX;
        return "⏳ It's not your turn! Waiting for **" + opponent + "**";
    }
    
    // Convert 1-indexed to 0-indexed
    int r = row - 1;
    int c = col - 1;
    
    // Make the move
    if (!session.game.makeMove(r, c, player)) {
        return "❌ Invalid move! Cell is occupied or out of range.";
    }
    
    std::stringstream ss;
    ss << renderBoard(session.game) << "\n\n";
    
    // Check game state
    auto state = session.game.getGameState();
    if (state == TicTacToe::GameState::X_WON) {
        ss << "🎉 **" << session.playerX << " (X) WINS!**";
        roomToGame_.erase(session.roomId);
        games_.erase(gameId);
    } else if (state == TicTacToe::GameState::O_WON) {
        ss << "🎉 **" << session.playerO << " (O) WINS!**";
        roomToGame_.erase(session.roomId);
        games_.erase(gameId);
    } else if (state == TicTacToe::GameState::DRAW) {
        ss << "🤝 **It's a DRAW!**";
        roomToGame_.erase(session.roomId);
        games_.erase(gameId);
    } else {
        std::string nextPlayer = (session.game.getCurrentPlayer() == TicTacToe::Player::X) 
                                  ? session.playerX : session.playerO;
        ss << "**" << nextPlayer << "**'s turn!";
    }
    
    return ss.str();
}

std::string GameHandler::resignGame(const std::string& gameId, const std::string& playerId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (games_.count(gameId) == 0) {
        return "❌ No active game to resign from!";
    }
    
    auto& session = games_[gameId];
    
    std::string winner;
    if (playerId == session.playerX) {
        winner = session.playerO;
    } else if (playerId == session.playerO) {
        winner = session.playerX;
    } else {
        return "❌ You're not a player in this game!";
    }
    
    roomToGame_.erase(session.roomId);
    games_.erase(gameId);
    
    return "🏳️ **" + playerId + "** resigned. **" + winner + "** wins by forfeit!";
}

std::string GameHandler::getGameStatus(const std::string& gameId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (games_.count(gameId) == 0) {
        return "No active game.";
    }
    
    auto& session = games_[gameId];
    std::stringstream ss;
    ss << "🎮 **Game Status**\n\n";
    ss << "Players: " << session.playerX << " (X) vs " << session.playerO << " (O)\n";
    ss << renderBoard(session.game);
    
    return ss.str();
}

std::string GameHandler::getActiveGameInRoom(const std::string& roomId) {
    std::lock_guard<std::mutex> lock(mutex_);
    
    if (roomToGame_.count(roomId) > 0) {
        return roomToGame_[roomId];
    }
    return "";
}

std::string GameHandler::renderBoard(const TicTacToe& game) {
    std::string state = game.getBoardState();
    
    std::stringstream ss;
    ss << "```\n";
    ss << "   1   2   3\n";
    ss << " ┌───┬───┬───┐\n";
    
    for (int row = 0; row < 3; ++row) {
        ss << (row + 1) << "│";
        for (int col = 0; col < 3; ++col) {
            char c = state[row * 3 + col];
            if (c == 'X') {
                ss << " ❌ │";
            } else if (c == 'O') {
                ss << " ⭕ │";
            } else {
                ss << "   │";
            }
        }
        ss << "\n";
        if (row < 2) {
            ss << " ├───┼───┼───┤\n";
        }
    }
    ss << " └───┴───┴───┘\n";
    ss << "```";
    
    return ss.str();
}
