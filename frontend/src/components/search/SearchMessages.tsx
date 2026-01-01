import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    roomId?: string;
}

interface SearchMessagesProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    onScrollToMessage?: (messageId: string) => void;
}

export default function SearchMessages({ isOpen, onClose, messages, onScrollToMessage }: SearchMessagesProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Message[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            const searchLower = query.toLowerCase();
            const filtered = messages.filter(msg =>
                msg.content.toLowerCase().includes(searchLower) ||
                msg.senderName.toLowerCase().includes(searchLower)
            ).sort((a, b) => b.timestamp - a.timestamp); // Most recent first

            setResults(filtered.slice(0, 20)); // Limit results
            setSelectedIndex(0);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            handleSelectResult(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [results, selectedIndex, onClose]);

    const handleSelectResult = (message: Message) => {
        if (onScrollToMessage) {
            onScrollToMessage(message.id);
        }
        onClose();
    };

    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-amber-500/40 text-amber-200 px-0.5 rounded">{part}</mark>
                : part
        );
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2"
                            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search messages..."
                            className="w-full py-3 px-4 pl-12 bg-black/30 border border-white/10 rounded-xl text-white text-base outline-none placeholder:text-slate-500 focus:border-violet-500/50 transition-colors"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white bg-transparent border-none cursor-pointer rounded"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {results.length > 0
                            ? `Found ${results.length} message${results.length === 1 ? '' : 's'}`
                            : query.trim() ? 'No messages found' : 'Type to search messages'
                        }
                    </p>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="py-2">
                            {results.map((message, index) => (
                                <button
                                    key={message.id}
                                    onClick={() => handleSelectResult(message)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-none cursor-pointer transition-colors ${index === selectedIndex
                                        ? 'bg-violet-500/20'
                                        : 'bg-transparent hover:bg-white/5'
                                        }`}
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName}`}
                                        alt={message.senderName}
                                        className="w-10 h-10 rounded-xl shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-white text-sm">
                                                {message.senderName}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatTime(message.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm line-clamp-2">
                                            {highlightMatch(message.content, query)}
                                        </p>
                                    </div>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#64748b"
                                        strokeWidth="2"
                                        className="shrink-0 mt-1"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    ) : query.trim() ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-slate-800 rounded-2xl">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <h4 className="text-white font-medium mb-1">No results found</h4>
                            <p className="text-slate-500 text-sm">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-violet-500/20 rounded-2xl">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <h4 className="text-white font-medium mb-1">Search Messages</h4>
                            <p className="text-slate-500 text-sm">Find messages by content or sender name</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Enter</kbd>
                            Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Esc</kbd>
                            Close
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
