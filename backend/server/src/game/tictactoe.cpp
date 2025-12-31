#include "game/tictactoe.h"
#include "utils/logger.h"

TicTacToe::TicTacToe()
    : currentPlayer_(Player::X)
    , gameState_(GameState::IN_PROGRESS) {
    reset();
}

TicTacToe::~TicTacToe() {
}

void TicTacToe::reset() {
    for (auto& row : board_) {
        row.fill(Player::NONE);
    }
    currentPlayer_ = Player::X;
    gameState_ = GameState::IN_PROGRESS;
}

bool TicTacToe::makeMove(int row, int col, Player player) {
    // Validate move
    if (!isValidMove(row, col)) {
        return false;
    }
    
    // Check if it's the correct player's turn
    if (player != currentPlayer_) {
        return false;
    }
    
    // Check if game is still in progress
    if (gameState_ != GameState::IN_PROGRESS) {
        return false;
    }
    
    // Make move
    board_[row][col] = player;
    
    // Check game state
    checkGameState();
    
    // Switch player if game continues
    if (gameState_ == GameState::IN_PROGRESS) {
        switchPlayer();
    }
    
    return true;
}

TicTacToe::GameState TicTacToe::getGameState() const {
    return gameState_;
}

TicTacToe::Player TicTacToe::getCurrentPlayer() const {
    return currentPlayer_;
}

std::string TicTacToe::getBoardState() const {
    std::string state;
    for (const auto& row : board_) {
        for (const auto& cell : row) {
            switch (cell) {
                case Player::X:
                    state += 'X';
                    break;
                case Player::O:
                    state += 'O';
                    break;
                default:
                    state += '-';
                    break;
            }
        }
    }
    return state;
}

bool TicTacToe::loadBoardState(const std::string& state) {
    if (state.length() != 9) {
        return false;
    }
    
    int idx = 0;
    for (int row = 0; row < 3; ++row) {
        for (int col = 0; col < 3; ++col) {
            char c = state[idx++];
            switch (c) {
                case 'X':
                    board_[row][col] = Player::X;
                    break;
                case 'O':
                    board_[row][col] = Player::O;
                    break;
                case '-':
                    board_[row][col] = Player::NONE;
                    break;
                default:
                    return false;
            }
        }
    }
    
    checkGameState();
    return true;
}

bool TicTacToe::isValidMove(int row, int col) const {
    if (row < 0 || row >= 3 || col < 0 || col >= 3) {
        return false;
    }
    return board_[row][col] == Player::NONE;
}

std::optional<TicTacToe::Player> TicTacToe::getWinner() const {
    if (gameState_ == GameState::X_WON) {
        return Player::X;
    } else if (gameState_ == GameState::O_WON) {
        return Player::O;
    }
    return std::nullopt;
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

void TicTacToe::checkGameState() {
    // Check for wins
    if (checkWin(Player::X)) {
        gameState_ = GameState::X_WON;
        Logger::info("Tic-Tac-Toe: X won!");
    } else if (checkWin(Player::O)) {
        gameState_ = GameState::O_WON;
        Logger::info("Tic-Tac-Toe: O won!");
    } else if (isBoardFull()) {
        gameState_ = GameState::DRAW;
        Logger::info("Tic-Tac-Toe: Draw!");
    } else {
        gameState_ = GameState::IN_PROGRESS;
    }
}

bool TicTacToe::checkWin(Player player) const {
    // Check rows
    for (int row = 0; row < 3; ++row) {
        if (board_[row][0] == player &&
            board_[row][1] == player &&
            board_[row][2] == player) {
            return true;
        }
    }
    
    // Check columns
    for (int col = 0; col < 3; ++col) {
        if (board_[0][col] == player &&
            board_[1][col] == player &&
            board_[2][col] == player) {
            return true;
        }
    }
    
    // Check diagonals
    if (board_[0][0] == player &&
        board_[1][1] == player &&
        board_[2][2] == player) {
        return true;
    }
    
    if (board_[0][2] == player &&
        board_[1][1] == player &&
        board_[2][0] == player) {
        return true;
    }
    
    return false;
}

bool TicTacToe::isBoardFull() const {
    for (const auto& row : board_) {
        for (const auto& cell : row) {
            if (cell == Player::NONE) {
                return false;
            }
        }
    }
    return true;
}

void TicTacToe::switchPlayer() {
    currentPlayer_ = (currentPlayer_ == Player::X) ? Player::O : Player::X;
}
