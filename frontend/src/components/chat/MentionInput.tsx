import { useState, useRef, useEffect } from 'react';

interface User {
    id: string;
    username: string;
    avatar?: string;
    online?: boolean;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    users: User[];
    placeholder?: string;
    disabled?: boolean;
}

export default function MentionInput({
    value,
    onChange,
    onSubmit,
    users,
    placeholder = 'Type a message...',
    disabled = false
}: MentionInputProps) {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter users based on mention query
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions

    useEffect(() => {
        // Check if we're in a mention context
        const textBeforeCursor = value.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionQuery(mentionMatch[1]);
            setShowMentions(true);
            setSelectedIndex(0);
        } else {
            setShowMentions(false);
        }
    }, [value, cursorPosition]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        setCursorPosition(e.target.selectionStart || 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectMention(filteredUsers[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const selectMention = (user: User) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
            const newValue = `${beforeMention}@${user.username} ${textAfterCursor}`;
            onChange(newValue);

            // Move cursor after the mention
            const newCursorPos = beforeMention.length + user.username.length + 2;
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                    inputRef.current.focus();
                }
            }, 0);
        }

        setShowMentions(false);
    };

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onSelect={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%',
                    padding: '14px 50px 14px 16px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />

            {/* Mention Suggestions Popup */}
            {showMentions && filteredUsers.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    right: 0,
                    marginBottom: '8px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    zIndex: 100
                }}>
                    <div style={{
                        padding: '8px 12px',
                        background: 'rgba(139,92,246,0.1)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '11px',
                        color: '#a78bfa',
                        fontWeight: '500'
                    }}>
                        Mention a user
                    </div>
                    {filteredUsers.map((user, index) => (
                        <div
                            key={user.id}
                            onClick={() => selectMention(user)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                background: index === selectedIndex ? 'rgba(139,92,246,0.2)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.username}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                                        {user.username[0].toUpperCase()}
                                    </span>
                                )}
                                {/* Online indicator */}
                                {user.online && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-1px',
                                        right: '-1px',
                                        width: '10px',
                                        height: '10px',
                                        background: '#22c55e',
                                        borderRadius: '50%',
                                        border: '2px solid #1e293b'
                                    }} />
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <span style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500' }}>
                                    @{user.username}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hint text */}
            {showMentions && filteredUsers.length === 0 && mentionQuery && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '8px',
                    padding: '10px 14px',
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#64748b'
                }}>
                    No users match "@{mentionQuery}"
                </div>
            )}
        </div>
    );
}
