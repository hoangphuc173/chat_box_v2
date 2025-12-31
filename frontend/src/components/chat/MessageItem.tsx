import type { Message } from '@/types/chat.types';

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    isEditing: boolean;
    editContent: string;
    showReactionPicker: boolean;
    onEditContentChange: (content: string) => void;
    onEditSave: () => void;
    onEditCancel: () => void;
    onEditStart: (messageId: string, content: string) => void;
    onDelete: (messageId: string) => void;
    onReactionClick: (messageId: string, emoji: string) => void;
    onReactionPickerToggle: (messageId: string) => void;
    onPinMessage?: (messageId: string) => void;
    formatTime: (timestamp: number) => string;
}

export function MessageItem({
    message,
    isOwn,
    showAvatar,
    isEditing,
    editContent,
    showReactionPicker,
    onEditContentChange,
    onEditSave,
    onEditCancel,
    onEditStart,
    onDelete,
    onReactionClick,
    onReactionPickerToggle,
    onPinMessage,
    formatTime
}: MessageItemProps) {
    const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    return (
        <div
            data-message-id={message.id}
            className={`flex gap-3 items-start relative group transition-colors duration-500 ${isOwn ? 'flex-row-reverse pl-0 pr-[5px]' : 'flex-row pr-0 pl-[5px]'
                }`}
        >
            {showAvatar && !isOwn && (
                <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName}`}
                    alt={message.senderName}
                    className="w-9 h-9 rounded-[10px] shrink-0"
                />
            )}

            <div className={`flex flex-col gap-1 max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                    <span className="text-xs text-violet-400 font-medium px-1">
                        {message.senderName}
                    </span>
                )}

                {isEditing ? (
                    <div className="w-full">
                        <input
                            type="text"
                            value={editContent}
                            onChange={(e) => onEditContentChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onEditSave();
                                if (e.key === 'Escape') onEditCancel();
                            }}
                            className="w-full p-2 bg-slate-800 border border-violet-500 rounded-lg text-white text-sm outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={onEditSave}
                                className="px-2 py-1 bg-violet-500 hover:bg-violet-600 text-white text-xs rounded border-none cursor-pointer"
                            >
                                Save
                            </button>
                            <button
                                onClick={onEditCancel}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded border-none cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={`relative p-3 rounded-xl text-[14px] leading-relaxed ${isOwn
                                ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white rounded-tr-sm'
                                : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                            }`}
                    >
                        {message.content}
                        {message.isEdited && (
                            <span className="text-xs opacity-60 ml-2">(edited)</span>
                        )}

                        <span className="text-[11px] opacity-70 ml-2">
                            {formatTime(message.timestamp)}
                        </span>

                        {/* Message Actions */}
                        <div
                            className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                                } flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-lg p-1 shadow-lg`}
                        >
                            <button
                                onClick={() => onReactionPickerToggle(message.id)}
                                className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                                title="Add reaction"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                    <line x1="9" y1="9" x2="9.01" y2="9" />
                                    <line x1="15" y1="9" x2="15.01" y2="9" />
                                </svg>
                            </button>

                            {isOwn && (
                                <>
                                    <button
                                        onClick={() => onEditStart(message.id, message.content)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                                        title="Edit"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete(message.id)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                        title="Delete"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {onPinMessage && (
                                <button
                                    onClick={() => onPinMessage(message.id)}
                                    className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 cursor-pointer"
                                    title="Pin"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 17v5" />
                                        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Quick Reactions */}
                        {showReactionPicker && (
                            <div className="absolute top-full left-0 mt-2 flex gap-1 bg-slate-900 p-2 rounded-xl shadow-xl z-10 border border-white/10">
                                {quickReactions.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => onReactionClick(message.id, emoji)}
                                        className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-lg text-lg cursor-pointer hover:scale-125 transition-transform"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Reactions Display */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 animate-fadeIn">
                        {Object.entries(
                            message.reactions.reduce((acc, r) => {
                                if (!acc[r.emoji]) {
                                    acc[r.emoji] = { count: 0, users: [] };
                                }
                                acc[r.emoji].count += 1;
                                acc[r.emoji].users.push(r.username);
                                return acc;
                            }, {} as Record<string, { count: number; users: string[] }>)
                        ).map(([emoji, data]) => (
                            <button
                                key={emoji}
                                onClick={() => onReactionClick(message.id, emoji)}
                                className="group/reaction flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/40 rounded-full text-sm cursor-pointer border border-violet-500/30 hover:border-violet-500/60 transition-all duration-200 hover:scale-105 active:scale-95"
                                title={`${data.users.join(', ')} reacted with ${emoji}`}
                            >
                                <span className="text-base group-hover/reaction:animate-bounce">{emoji}</span>
                                <span className="text-violet-300 font-medium text-xs min-w-[1ch]">{data.count}</span>
                            </button>
                        ))}

                        {/* Add reaction button */}
                        <button
                            onClick={() => onReactionPickerToggle(message.id)}
                            className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-200 cursor-pointer border border-white/10 hover:border-white/20 transition-all duration-200"
                            title="Add reaction"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
