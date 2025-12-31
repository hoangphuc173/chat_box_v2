import { useState } from 'react';

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        username: string;
        email?: string;
        avatar?: string;
        displayName?: string;
        statusMessage?: string;
        joinedAt?: number;
    };
    onUpdateProfile: (data: {
        displayName?: string;
        statusMessage?: string;
        avatar?: string;
    }) => void;
    isOwnProfile?: boolean;
}

export function UserProfileModal({ isOpen, onClose, user, onUpdateProfile, isOwnProfile = false }: UserProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user.displayName || user.username);
    const [statusMessage, setStatusMessage] = useState(user.statusMessage || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onUpdateProfile({
            displayName,
            statusMessage,
            avatar: avatarPreview || undefined
        });
        setIsEditing(false);
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return 'Unknown';
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md bg-[#1e293b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Banner */}
                <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 rounded-full text-white/80 cursor-pointer border-none transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Avatar */}
                <div className="px-6 relative">
                    <div className="relative -mt-12 mb-4">
                        <img
                            src={avatarPreview || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                            alt={user.username}
                            className="w-24 h-24 rounded-2xl border-4 border-[#1e293b] object-cover"
                        />
                        {isEditing && isOwnProfile && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1e293b]" />
                    </div>

                    {/* User Info */}
                    <div className="pb-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Display Name"
                                    className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white text-lg font-semibold outline-none focus:border-violet-500"
                                />
                                <input
                                    type="text"
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                    placeholder="What's on your mind?"
                                    className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-slate-300 text-sm outline-none focus:border-violet-500"
                                    maxLength={100}
                                />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    {user.displayName || user.username}
                                </h2>
                                <p className="text-slate-400 text-sm mb-2">@{user.username}</p>
                                {user.statusMessage && (
                                    <p className="text-slate-300 text-sm italic">"{user.statusMessage}"</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-slate-200 text-sm">{user.email || `${user.username}@chatbox.local`}</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
                        <p className="text-slate-200 text-sm">{formatDate(user.joinedAt)}</p>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">User ID</p>
                        <p className="text-slate-400 text-xs font-mono truncate">{user.id}</p>
                    </div>
                </div>

                {/* Actions */}
                {isOwnProfile && (
                    <div className="px-6 pb-6 flex gap-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-colors border-none cursor-pointer shadow-lg shadow-violet-500/20"
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-medium transition-colors border-none cursor-pointer shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit Profile
                            </button>
                        )}
                    </div>
                )}

                {/* Action Buttons for Other Users */}
                {!isOwnProfile && (
                    <div className="px-6 pb-6 flex gap-3">
                        <button className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-medium transition-colors border-none cursor-pointer">
                            Send Message
                        </button>
                        <button className="w-12 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border-none cursor-pointer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
