import { useState } from 'react';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    replyToId?: string;
    replyToContent?: string;
    replyToSender?: string;
}

interface ThreadViewProps {
    parentMessage: Message;
    replies: Message[];
    currentUserId: string;
    onReply: (content: string, parentId: string) => void;
    onClose: () => void;
}

export default function ThreadView({
    parentMessage,
    replies,
    currentUserId,
    onReply,
    onClose
}: ThreadViewProps) {
    const [replyContent, setReplyContent] = useState('');

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim()) {
            onReply(replyContent.trim(), parentMessage.id);
            setReplyContent('');
        }
    };

    const formatTime = (timestamp: number) => {
        const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        return new Date(ts).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '400px',
            height: '100vh',
            background: '#0f172a',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: '#111827'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>💬</span>
                    <span style={{ color: '#f1f5f9', fontWeight: '600' }}>Thread</span>
                    <span style={{
                        padding: '2px 8px',
                        background: 'rgba(139,92,246,0.2)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#a78bfa'
                    }}>
                        {replies.length} replies
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#94a3b8',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Parent Message */}
            <div style={{
                padding: '16px 20px',
                background: 'rgba(139,92,246,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                }}>
                    <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${parentMessage.senderName}`}
                        alt={parentMessage.senderName}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px'
                        }}
                    />
                    <span style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '13px' }}>
                        {parentMessage.senderName}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                        {formatTime(parentMessage.timestamp)}
                    </span>
                </div>
                <p style={{
                    margin: 0,
                    color: '#e2e8f0',
                    fontSize: '14px',
                    lineHeight: '1.5'
                }}>
                    {parentMessage.content}
                </p>
            </div>

            {/* Replies */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px'
            }}>
                {replies.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#64748b',
                        padding: '40px 20px'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🧵</div>
                        <p style={{ margin: 0 }}>No replies yet</p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                            Be the first to reply!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {replies.map((reply) => {
                            const isOwn = reply.senderId === currentUserId;

                            return (
                                <div
                                    key={reply.id}
                                    style={{
                                        display: 'flex',
                                        gap: '10px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.senderName}`}
                                        alt={reply.senderName}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '8px',
                                            flexShrink: 0
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '4px'
                                        }}>
                                            <span style={{
                                                color: isOwn ? '#a78bfa' : '#e2e8f0',
                                                fontWeight: '600',
                                                fontSize: '12px'
                                            }}>
                                                {reply.senderName}
                                            </span>
                                            <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                {formatTime(reply.timestamp)}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            color: '#cbd5e1',
                                            fontSize: '13px',
                                            lineHeight: '1.4'
                                        }}>
                                            {reply.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reply Input */}
            <form
                onSubmit={handleSubmitReply}
                style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: '#111827',
                    display: 'flex',
                    gap: '12px'
                }}
            >
                <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Reply to thread..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: '#f1f5f9',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    style={{
                        padding: '12px 20px',
                        background: replyContent.trim()
                            ? 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                            : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: replyContent.trim() ? 'pointer' : 'not-allowed',
                        opacity: replyContent.trim() ? 1 : 0.5
                    }}
                >
                    Reply
                </button>
            </form>
        </div>
    );
}

// Helper component to show reply indicator on messages
export function ReplyIndicator({
    replyToContent,
    replyToSender,
    onClick
}: {
    replyToContent: string;
    replyToSender: string;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: 'rgba(139,92,246,0.1)',
                borderRadius: '8px',
                marginBottom: '6px',
                cursor: onClick ? 'pointer' : 'default',
                borderLeft: '3px solid #8b5cf6'
            }}
        >
            <span style={{ color: '#a78bfa', fontSize: '11px' }}>↩️</span>
            <span style={{
                color: '#a78bfa',
                fontSize: '11px',
                fontWeight: '600'
            }}>
                {replyToSender}
            </span>
            <span style={{
                color: '#94a3b8',
                fontSize: '11px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '150px'
            }}>
                {replyToContent}
            </span>
        </div>
    );
}
