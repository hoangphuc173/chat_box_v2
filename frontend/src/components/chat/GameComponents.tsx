// Game Components (Tic-Tac-Toe and Chess placeholder)

interface TicTacToeProps {
    gameId: string;
    board: string[];
    currentTurn: string;
    players: { X: string; O: string };
    currentUserId: string;
    onMove: (gameId: string, position: number) => void;
    winner: string | null;
    status: 'waiting' | 'playing' | 'finished';
}

export function TicTacToeGame({ gameId, board, currentTurn, players, currentUserId, onMove, winner, status }: TicTacToeProps) {
    const isMyTurn = (players.X === currentUserId && currentTurn === 'X') ||
        (players.O === currentUserId && currentTurn === 'O');
    const mySymbol = players.X === currentUserId ? 'X' : 'O';

    const handleCellClick = (index: number) => {
        if (status === 'playing' && isMyTurn && !board[index] && !winner) {
            onMove(gameId, index);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⭕❌</span>
                    </div>
                    <span className="text-white font-semibold">Tic-Tac-Toe</span>
                </div>
                {status === 'playing' && (
                    <div className="text-sm">
                        <span className="text-slate-400">Turn: </span>
                        <span className={`font-semibold ${isMyTurn ? 'text-emerald-400' : 'text-orange-400'
                            }`}>
                            {isMyTurn ? 'You' : 'Opponent'} ({currentTurn})
                        </span>
                    </div>
                )}
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        onClick={() => handleCellClick(index)}
                        disabled={status !== 'playing' || !isMyTurn || !!cell || !!winner}
                        className={`aspect-square rounded-lg text-2xl font-bold flex items-center justify-center transition-all ${cell
                                ? cell === 'X'
                                    ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                                    : 'bg-red-500/20 text-red-400 border-2 border-red-500'
                                : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-700 cursor-pointer'
                            } ${(status !== 'playing' || !isMyTurn || !!winner) && !cell
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            }`}
                    >
                        {cell}
                    </button>
                ))}
            </div>

            {/* Status */}
            <div className="text-center">
                {winner ? (
                    <div className={`font-semibold ${winner === mySymbol ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {winner === mySymbol ? '🎉 You Won!' : '😢 You Lost!'}
                    </div>
                ) : status === 'finished' ? (
                    <div className="text-slate-400 font-semibold">Game Ended - Draw!</div>
                ) : status === 'waiting' ? (
                    <div className="text-slate-400">Waiting for opponent...</div>
                ) : (
                    <div className="text-slate-400">
                        {isMyTurn ? 'Your turn - click to place' : 'Waiting for opponent...'}
                    </div>
                )}
            </div>
        </div>
    );
}

// Chess placeholder
interface ChessProps {
    gameId: string;
    position: string;
    currentTurn: 'white' | 'black';
}

export function ChessGame({ gameId: _gameId, position: _position, currentTurn: _currentTurn }: ChessProps) {
    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="text-center py-8">
                <div className="text-4xl mb-2">♟️</div>
                <div className="text-white font-semibold mb-1">Chess</div>
                <div className="text-sm text-slate-400">Coming soon!</div>
            </div>
        </div>
    );
}
