import React, { useState, useRef } from 'react';
import type { MessageMetadata } from '@/types/chat.types';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    type?: string;
    metadata?: MessageMetadata;
    reactions?: { emoji: string; userId: string; username: string }[];
    isEdited?: boolean;
    isDeleted?: boolean;
}

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar: boolean;
    isEditing: boolean;
    onEditStart: (id: string, content: string) => void;
    onEditSave: (id: string, content: string) => void;
    onEditCancel: () => void;
    onDelete: (id: string) => void;
    onPin: (id: string) => void;
    onReply: (message: Message) => void;
    onReactionAdd: (id: string, emoji: string) => void;
    showReactionPicker: boolean;
    onToggleReactionPicker: (id: string | null) => void;
    quickReactions: string[];
}

export const MessageBubble = React.memo(({
    message,
    isOwn,
    showAvatar,
    isEditing,
    onEditStart,
    onEditSave,
    onEditCancel,
    onDelete,
    onPin,
    onReply,
    onReactionAdd,
    showReactionPicker,
    onToggleReactionPicker,
    quickReactions
}: MessageBubbleProps) => {
    const [editContent, setEditContent] = useState(message.content);
    const reactionTimeoutRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

    const handleEditSaveInternal = () => {
        onEditSave(message.id, editContent);
    };

    const handleReactionClick = (emoji: string) => {
        // Prevent double-click within 300ms
        const key = `${message.id}-${emoji}`;
        if (reactionTimeoutRef.current[key]) {
            return;
        }
        
        onReactionAdd(message.id, emoji);
        
        reactionTimeoutRef.current[key] = setTimeout(() => {
            delete reactionTimeoutRef.current[key];
        }, 300);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            data-message-id={message.id}
            className={`flex gap-3 items-start relative group transition-colors duration-500 ${isOwn ? 'flex-row-reverse pl-0 pr-[5px]' : 'flex-row pr-0 pl-[5px]'}`}
        >
            {showAvatar && !isOwn && (
                <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName}`}
                    alt={message.senderName}
                    className="w-9 h-9 rounded-[10px] shrink-0"
                />
            )}
            {!showAvatar && !isOwn && <div className="w-9 shrink-0" />}

            <div className="max-w-[65%] relative">
                {showAvatar && !isOwn && (
                    <span className="block text-xs font-semibold text-violet-500 mb-1">
                        {message.senderName}
                    </span>
                )}

                <div className={`p-3 px-4 relative ${message.isDeleted
                    ? 'bg-slate-500/20 italic text-slate-500'
                    : isOwn
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white border-none rounded-l-2xl rounded-tr-sm rounded-br-2xl'
                        : 'bg-slate-800 border border-white/10 text-slate-100 rounded-r-2xl rounded-tl-sm rounded-bl-2xl'
                    }`}>
                    {message.isDeleted ? (
                        <p className="m-0">🚫 Message deleted</p>
                    ) : isEditing ? (
                        <div>
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSaveInternal();
                                    if (e.key === 'Escape') onEditCancel();
                                }}
                                className="w-full p-2 bg-white/20 border border-white/30 rounded-lg text-white outline-none"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleEditSaveInternal} className="px-3 py-1 bg-green-500 border-none rounded-md text-white cursor-pointer text-xs">Save</button>
                                <button onClick={onEditCancel} className="px-3 py-1 bg-slate-500 border-none rounded-md text-white cursor-pointer text-xs">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* File/Image/Voice Attachment */}
                            {message.metadata?.url && (
                                <div className="mb-2">
                                    {message.metadata.type === 'image' || message.metadata.mimeType?.startsWith('image/') ? (
                                        <a href={message.metadata.url} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={message.metadata.url}
                                                alt={message.metadata.fileName || 'Image'}
                                                className="max-w-full max-h-60 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </a>
                                    ) : message.metadata.type === 'voice' || message.metadata.mimeType?.startsWith('audio/') ? (
                                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                                            <span className="text-lg">🎤</span>
                                            <audio
                                                src={message.metadata.url}
                                                controls
                                                className="h-8 max-w-[200px]"
                                            />
                                        </div>
                                    ) : (
                                        <a
                                            href={message.metadata.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors no-underline"
                                        >
                                            <span className="text-2xl">📎</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="m-0 text-sm font-medium truncate text-inherit">
                                                    {message.metadata.fileName || 'File'}
                                                </p>
                                                {message.metadata.fileSize && (
                                                    <p className="m-0 text-xs opacity-70">
                                                        {(message.metadata.fileSize / 1024).toFixed(1)} KB
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-lg opacity-70">⬇️</span>
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Text content (only show if not just emoji placeholder) */}
                            {message.content && !message.content.startsWith('📎') && !message.content.startsWith('🎤') && (
                                <p className="m-0 text-sm leading-relaxed break-words whitespace-pre-wrap">
                                    {message.content}
                                    {message.isEdited && (
                                        <span className="text-[11px] opacity-70 ml-2">(edited)</span>
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                    {!message.isDeleted && !isEditing && (
                        <div className={`absolute -top-3 flex gap-1 bg-slate-800 p-1 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'right-full mr-2' : 'left-full ml-2'}`}>
                            <button
                                onClick={() => onToggleReactionPicker(showReactionPicker ? null : message.id)}
                                className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md cursor-pointer hover:bg-white/10 text-sm"
                                title="Add reaction"
                            >
                                😀
                            </button>

                            <button
                                onClick={() => onReply(message)}
                                className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-slate-400 cursor-pointer hover:bg-white/10 hover:text-slate-200"
                                title="Reply"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 17 4 12 9 7" />
                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                            </button>



                            <button
                                onClick={() => onPin(message.id)}
                                className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md cursor-pointer hover:bg-white/10 text-slate-400 hover:text-yellow-400"
                                title="Pin message"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 17v5" />
                                    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1v4.76z" />
                                </svg>
                            </button>

                            {isOwn && (
                                <>
                                    <button
                                        onClick={() => onEditStart(message.id, message.content)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-slate-400 cursor-pointer hover:bg-white/10 hover:text-slate-200"
                                        title="Edit"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete(message.id)}
                                        className="w-7 h-7 flex items-center justify-center bg-transparent border-none rounded-md text-red-500 cursor-pointer hover:bg-red-500/10"
                                        title="Delete"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {showReactionPicker && (
                        <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-slate-800 p-2 rounded-xl border border-white/10 z-10">
                            {quickReactions.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReactionClick(emoji)}
                                    className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-lg text-lg cursor-pointer hover:scale-125 transition-transform"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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
                                onClick={() => onReactionAdd(message.id, emoji)}
                                className="group/reaction flex items-center gap-1 px-2 py-1 bg-violet-500/20 hover:bg-violet-500/40 rounded-full text-sm cursor-pointer border border-violet-500/30 hover:border-violet-500/60 transition-all duration-200 hover:scale-105 active:scale-95"
                                title={`${data.users.join(', ')} reacted with ${emoji}`}
                            >
                                <span className="text-base group-hover/reaction:animate-bounce">{emoji}</span>
                                <span className="text-violet-300 font-medium text-xs min-w-[1ch]">{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                <span className={`block text-[11px] text-slate-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp)}
                </span>
            </div>
        </div>
    );
});
