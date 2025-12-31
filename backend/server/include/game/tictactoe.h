#ifndef TICTACTOE_H
#define TICTACTOE_H

#include <string>
#include <array>
#include <optional>

/**
 * Tic-Tac-Toe Game Logic
 * 
 * Features:
 * - 3x3 board
 * - Two players (X and O)
 * - Win detection (rows, columns, diagonals)
 * - Draw detection
 * - Move validation
 */
class TicTacToe {
public:
    enum class Player {
        NONE = 0,
        X = 1,
        O = 2
    };
    
    enum class GameState {
        IN_PROGRESS,
        X_WON,
        O_WON,
        DRAW
    };
    
    TicTacToe();
    ~TicTacToe();
    
    /**
     * Make a move
     * @param row Row index (0-2)
     * @param col Column index (0-2)
     * @param player Player making the move
     * @return true if move was valid
     */
    bool makeMove(int row, int col, Player player);
    
    /**
     * Get current game state
     */
    GameState getGameState() const;
    
    /**
     * Get current player turn
     */
    Player getCurrentPlayer() const;
    
    /**
     * Get board state as string (for serialization)
     * Format: "XOXO-X-O-" (9 chars, - = empty)
     */
    std::string getBoardState() const;
    
    /**
     * Load board from string
     */
    bool loadBoardState(const std::string& state);
    
    /**
     * Reset game
     */
    void reset();
    
    /**
     * Check if position is valid and empty
     */
    bool isValidMove(int row, int col) const;
    
    /**
     * Get winner (if game ended)
     */
    std::optional<Player> getWinner() const;
    
private:
    std::array<std::array<Player, 3>, 3> board_;
    Player currentPlayer_;
    GameState gameState_;
    
    // Helper functions
    void checkGameState();
    bool checkWin(Player player) const;
    bool isBoardFull() const;
    void switchPlayer();
};

#endif // TICTACTOE_H
