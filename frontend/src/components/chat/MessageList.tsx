import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { TicTacToeMessage } from './TicTacToeMessage'

export function MessageList() {
    const { messages } = useChatStore()
    const { userId } = useAuthStore()
    const { editMessage, deleteMessage, sendMessage } = useWebSocket()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-900">
                <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg">No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation!</p>
                </div>
            </div>
        )
    }

    const handleEdit = (messageId: string, content: string) => {
        setEditingId(messageId)
        setEditContent(content)
    }

    const handleSaveEdit = (messageId: string) => {
        if (editContent.trim()) {
            editMessage(messageId, editContent.trim())
            setEditingId(null)
            setEditContent('')
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditContent('')
    }

    const handleDelete = (messageId: string) => {
        if (confirm('Delete this message?')) {
            deleteMessage(messageId)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
            {messages.map((message) => {
                const isOwn = message.userId === userId
                const isHistory = message.isHistory
                const isEditing = editingId === message.messageId
                const isDeleted = message.isDeleted

                if (isDeleted) {
                    return (
                        <div
                            key={message.messageId}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} opacity-50`}
                        >
                            <div className="max-w-[70%] bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-700">
                                <p className="text-slate-500 italic">🚫 Message deleted</p>
                            </div>
                        </div>
                    )
                }

                return (
                    <div
                        key={message.messageId}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isHistory ? 'opacity-60' : 'animate-fade-in'} group`}
                    >
                        <div className={`max-w-[70%] relative`}>
                            {!isOwn && (
                                <div className="text-xs text-slate-400 mb-1 ml-3 font-medium">
                                    {message.username}
                                </div>
                            )}
                            <div
                                className={`rounded-2xl px-4 py-3 shadow-lg ${isOwn
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-slate-800 text-white border border-slate-700'
                                    }`}
                            >
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit(message.messageId)
                                                if (e.key === 'Escape') handleCancelEdit()
                                            }}
                                            className="w-full bg-white/20 border border-white/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(message.messageId)}
                                                className="p-1 hover:bg-white/20 rounded transition"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="p-1 hover:bg-white/20 rounded transition"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed text-sm">
                                        <ReactMarkdown
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-indigo-400" {...props} />,
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>

                                        {/* Tic-Tac-Toe Board */}
                                        {(message.content.includes('Tic-Tac-Toe Started') || message.content.includes('Game Status') || message.content.includes("turn!")) && message.content.includes('┌───┬') && (
                                            <TicTacToeMessage
                                                content={message.content}
                                                onMove={(r, c) => sendMessage(message.roomId, `/move ${r} ${c}`)}
                                                isOwnTurn={true} // Simplified: Always enable for now because parsing auth from message text is hard. Backend will reject invalid moves anyway.
                                            />
                                        )}

                                        {message.editedAt && (
                                            <span className="text-xs opacity-70 ml-2">(edited)</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Edit/Delete buttons for own messages */}
                            {isOwn && !isEditing && (
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={() => handleEdit(message.messageId, message.content)}
                                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-full shadow-lg transition"
                                        title="Edit message"
                                    >
                                        <Pencil size={14} className="text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(message.messageId)}
                                        className="p-1.5 bg-red-600 hover:bg-red-500 rounded-full shadow-lg transition"
                                        title="Delete message"
                                    >
                                        <Trash2 size={14} className="text-white" />
                                    </button>
                                </div>
                            )}

                            <div
                                className={`text-xs text-slate-500 mt-1 ${isOwn ? 'text-right mr-3' : 'ml-3'}`}
                            >
                                {formatDistanceToNow(message.timestamp * 1000, {
                                    addSuffix: true
                                })}
                                {isHistory && ' • History'}
                                {message.editedAt && ` • Edited ${formatDistanceToNow(message.editedAt * 1000, { addSuffix: true })}`}
                                {isOwn && (
                                    <span className="ml-2">
                                        {message.isRead ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
            <div ref={messagesEndRef} />
        </div>
    )
}
