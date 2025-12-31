import { Phone, Video, Bot, BarChart3, Gamepad2, Tv, Search } from 'lucide-react';

interface ChatHeaderProps {
    currentRoom: string | null;
    onToggleRightPanel: () => void;
    onStartCall?: (type: 'audio' | 'video') => void;
    onShowAIModal?: () => void;
    onShowPollModal?: () => void;
    onShowGameModal?: () => void;
    onShowWatchModal?: () => void;
    onShowSearch?: () => void;
}

export function ChatHeader({
    currentRoom,
    onToggleRightPanel,
    onStartCall,
    onShowAIModal,
    onShowPollModal,
    onShowGameModal,
    onShowWatchModal,
    onShowSearch
}: ChatHeaderProps) {
    return (
        <header className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0 bg-[#111827]">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    #{currentRoom || 'Chat'}
                </h2>
            </div>

            <div className="flex gap-2">
                {/* Feature Buttons */}
                {onShowAIModal && (
                    <button
                        onClick={onShowAIModal}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-violet-400 cursor-pointer hover:bg-violet-500/20 transition-colors"
                        title="AI Assistant"
                    >
                        <Bot size={20} />
                    </button>
                )}

                {onShowPollModal && (
                    <button
                        onClick={onShowPollModal}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                        title="Create Poll"
                    >
                        <BarChart3 size={20} />
                    </button>
                )}

                {onShowGameModal && (
                    <button
                        onClick={onShowGameModal}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-orange-400 cursor-pointer hover:bg-orange-500/20 transition-colors"
                        title="Play Games"
                    >
                        <Gamepad2 size={20} />
                    </button>
                )}

                {onShowWatchModal && (
                    <button
                        onClick={onShowWatchModal}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-pink-400 cursor-pointer hover:bg-pink-500/20 transition-colors"
                        title="Watch Together"
                    >
                        <Tv size={20} />
                    </button>
                )}

                {onShowSearch && (
                    <button
                        onClick={onShowSearch}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-colors"
                        title="Search Messages (Ctrl+F)"
                    >
                        <Search size={20} />
                    </button>
                )}

                <div className="w-[1px] h-6 bg-white/10 my-auto mx-1" />

                {/* Call Buttons */}
                {onStartCall && (
                    <>
                        <button
                            onClick={() => onStartCall('audio')}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                            title="Audio Call"
                        >
                            <Phone size={20} />
                        </button>
                        <button
                            onClick={() => onStartCall('video')}
                            className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-blue-400 cursor-pointer hover:bg-blue-500/20 transition-colors"
                            title="Video Call"
                        >
                            <Video size={20} />
                        </button>
                    </>
                )}

                {/* Right Panel Toggle */}
                <button
                    onClick={onToggleRightPanel}
                    className="w-10 h-10 flex items-center justify-center bg-white/5 border-none rounded-xl text-slate-400 cursor-pointer hover:text-white hover:bg-white/10 transition-colors"
                    title="Toggle Right Panel"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                </button>
            </div>
        </header>
    );
}
