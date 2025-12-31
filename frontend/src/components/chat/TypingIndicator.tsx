interface TypingUser {
    id: string;
    username: string;
}

interface TypingIndicatorProps {
    typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
    if (typingUsers.length === 0) return null;

    const getText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0].username} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
        } else {
            return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing`;
        }
    };

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-violet-400 text-sm animate-pulse">
            <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>{getText()}</span>
        </div>
    );
}
