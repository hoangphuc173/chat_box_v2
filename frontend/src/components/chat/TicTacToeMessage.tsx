// Tic-Tac-Toe Message Display Component
// Used for text-based game rendering from bot messages

interface TicTacToeMessageProps {
    content?: string;
    onMove: (row: string, col: number) => void;
    isOwnTurn: boolean;
}

export function TicTacToeMessage({ content, onMove: _onMove, isOwnTurn }: TicTacToeMessageProps) {
    // This is for legacy text-based game display
    // The actual game component is TicTacToeGame in GameComponents.tsx
    if (!content) return null;
    
    return (
        <div className="mt-2 text-xs text-slate-400">
            {isOwnTurn && (
                <p>Click on the board or use /move command</p>
            )}
        </div>
    );
}
