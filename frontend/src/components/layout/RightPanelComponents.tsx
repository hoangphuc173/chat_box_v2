// RightPanel sub-components

interface PanelHeaderProps {
    roomId: string;
    onClose: () => void;
}

export function PanelHeader({ roomId: _roomId, onClose }: PanelHeaderProps) {
    return (
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <h3 className="text-white font-semibold">Room Info</h3>
            <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-lg text-slate-400 cursor-pointer hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
}

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export function TabButton({ active, onClick, children }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-2 text-sm font-medium border-none cursor-pointer transition-colors ${active
                    ? 'text-violet-400 border-b-2 border-violet-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
        >
            {children}
        </button>
    );
}

interface MemberItemProps {
    user: {
        id: string;
        username: string;
        avatar?: string;
        online: boolean;
        role?: string;
    };
    isCurrentUser: boolean;
    onKick?: (userId: string) => void;
    onBlock?: (userId: string) => void;
}

export function MemberItem({ user, isCurrentUser, onKick, onBlock }: MemberItemProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg relative">
            <div className="relative">
                <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-lg"
                />
                {user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f172a]" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{user.username}</span>
                    {user.role === 'admin' && (
                        <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-[10px] rounded">
                            ADMIN
                        </span>
                    )}
                </div>
                <span className="text-xs text-slate-500">
                    {user.online ? 'Online' : 'Offline'}
                </span>
            </div>
            {!isCurrentUser && (onKick || onBlock) && (
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 rounded-lg shadow-xl border border-white/10 overflow-hidden z-10">
                            {onKick && (
                                <button
                                    onClick={() => {
                                        onKick(user.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-orange-400 hover:bg-white/5 border-none cursor-pointer"
                                >
                                    Kick
                                </button>
                            )}
                            {onBlock && (
                                <button
                                    onClick={() => {
                                        onBlock(user.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5 border-none cursor-pointer"
                                >
                                    Block
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';

interface RoomActionsProps {
    roomId: string;
    isMuted: boolean;
    onToggleMute: () => void;
    onShowInvite: () => void;
    onShowSettings: () => void;
    onLeaveRoom: () => void;
}

export function RoomActions({
    roomId: _roomId,
    isMuted,
    onToggleMute,
    onShowInvite,
    onShowSettings,
    onLeaveRoom
}: RoomActionsProps) {
    return (
        <div className="p-4 border-t border-white/10 space-y-2">
            <button
                onClick={onToggleMute}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl text-slate-400 text-[13px] cursor-pointer hover:bg-white/5 transition-colors"
            >
                {isMuted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                )}
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
            </button>

            <button
                onClick={onShowInvite}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl text-slate-400 text-[13px] cursor-pointer hover:bg-white/5 transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Invite People
            </button>

            <button
                onClick={onShowSettings}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl text-slate-400 text-[13px] cursor-pointer hover:bg-white/5 transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6" />
                    <path d="m22 12-6-6-6 6-6-6-2 2" />
                </svg>
                Room Settings
            </button>

            <button
                onClick={onLeaveRoom}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-transparent border-none rounded-xl text-red-400 text-[13px] cursor-pointer hover:bg-red-500/10 transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Leave Room
            </button>
        </div>
    );
}
