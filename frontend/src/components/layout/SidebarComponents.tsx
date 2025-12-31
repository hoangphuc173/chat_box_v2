// Sidebar section components

interface RoomItemProps {
    room: {
        id: string;
        name: string;
        lastMessage?: string;
        unreadCount?: number;
    };
    isActive: boolean;
    onClick: () => void;
}

export function RoomItem({ room, isActive, onClick }: RoomItemProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-none cursor-pointer text-left ${isActive
                    ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border-l-4 border-violet-500'
                    : 'bg-transparent hover:bg-white/5'
                }`}
        >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                #
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {room.name}
                    </span>
                    {room.unreadCount && room.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-violet-500 rounded-full text-xs text-white">
                            {room.unreadCount}
                        </span>
                    )}
                </div>
                {room.lastMessage && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                        {room.lastMessage}
                    </p>
                )}
            </div>
        </button>
    );
}

interface UserItemProps {
    user: {
        id: string;
        username: string;
        avatar?: string;
        online: boolean;
        status?: 'online' | 'away' | 'dnd' | 'invisible';
    };
    onClick?: () => void;
}

export function UserItem({ user, onClick }: UserItemProps) {
    const statusColors = {
        online: 'bg-emerald-500',
        away: 'bg-amber-500',
        dnd: 'bg-red-500',
        invisible: 'bg-slate-500'
    };

    const statusColor = user.status ? statusColors[user.status] : 'bg-emerald-500';

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors border-none cursor-pointer text-left"
        >
            <div className="relative">
                <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-9 h-9 rounded-xl"
                />
                {user.online && (
                    <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusColor} rounded-full border-2 border-[#111827]`} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-300 truncate block">
                    {user.username}
                </span>
            </div>
        </button>
    );
}

interface CreateRoomFormProps {
    onSubmit: (roomName: string) => void;
    onCancel: () => void;
}

export function CreateRoomForm({ onSubmit, onCancel }: CreateRoomFormProps) {
    const [roomName, setRoomName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomName.trim()) {
            onSubmit(roomName.trim());
            setRoomName('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-slate-800 rounded-xl mb-3">
            <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-violet-500"
                autoFocus
            />
            <div className="flex gap-2 mt-2">
                <button
                    type="submit"
                    className="flex-1 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded-lg border-none cursor-pointer"
                >
                    Create
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg border-none cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

import { useState } from 'react';

interface PresenceStatus {
    icon: string;
    label: string;
    color: string;
}

const PRESENCE_OPTIONS: Record<'online' | 'away' | 'dnd' | 'invisible', PresenceStatus> = {
    online: { icon: '🟢', label: 'Online', color: 'text-emerald-400' },
    away: { icon: '🟡', label: 'Away', color: 'text-amber-400' },
    dnd: { icon: '🔴', label: 'Do Not Disturb', color: 'text-red-400' },
    invisible: { icon: '⚫', label: 'Invisible', color: 'text-slate-400' }
};

interface PresenceSelectorProps {
    currentStatus: 'online' | 'away' | 'dnd' | 'invisible';
    onChange: (status: 'online' | 'away' | 'dnd' | 'invisible') => void;
}

export function PresenceSelector({ currentStatus, onChange }: PresenceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const current = PRESENCE_OPTIONS[currentStatus];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm cursor-pointer border-none transition-colors"
            >
                <span>{current.icon}</span>
                <span className={current.color}>{current.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                    {(Object.keys(PRESENCE_OPTIONS) as Array<keyof typeof PRESENCE_OPTIONS>).map((status) => {
                        const option = PRESENCE_OPTIONS[status];
                        return (
                            <button
                                key={status}
                                onClick={() => {
                                    onChange(status);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-none cursor-pointer text-left ${status === currentStatus ? 'bg-violet-500/10' : ''
                                    }`}
                            >
                                <span className="text-lg">{option.icon}</span>
                                <span className={`text-sm ${option.color}`}>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
