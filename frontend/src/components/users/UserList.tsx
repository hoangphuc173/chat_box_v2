import { useChatStore } from '@/stores/chatStore'
import { useWebSocket } from '@/contexts/WebSocketContext'
import { useAuthStore } from '@/stores/authStore'
import { User, MessageCircle } from 'lucide-react'

export function UserList() {
    const { onlineUsers } = useChatStore()
    const { userId: currentUserId } = useAuthStore()
    const { createRoom, setCurrentRoomId } = useWebSocket()

    const handleStartDM = (targetUser: { userId: string; username: string }) => {
        // Create DM room with naming convention: dm-{user1}-{user2} (sorted)
        const users = [currentUserId, targetUser.userId].sort()
        const dmRoomId = `dm-${users[0]}-${users[1]}`
        const dmRoomName = `DM: ${targetUser.username}`

        // Create DM room
        createRoom(dmRoomName)

        // Switch to DM room
        setTimeout(() => {
            setCurrentRoomId(dmRoomId)
        }, 200)
    }

    return (
        <div className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={16} />
                    Online ({onlineUsers.length})
                </h3>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
                {onlineUsers.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        No users online
                    </div>
                ) : (
                    <div className="p-2">
                        {onlineUsers.map((user) => {
                            const isCurrentUser = user.userId === currentUserId

                            return (
                                <button
                                    key={user.userId}
                                    onClick={() => !isCurrentUser && handleStartDM(user)}
                                    disabled={isCurrentUser}
                                    className={`w-full p-3 rounded-lg flex items-center gap-3 mb-1 transition group ${isCurrentUser
                                        ? 'bg-slate-700/50 cursor-default'
                                        : 'hover:bg-slate-700 cursor-pointer'
                                        }`}
                                    title={isCurrentUser ? 'You' : `Click to send DM to ${user.username}`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Username */}
                                    <span className="flex-1 text-left text-sm font-medium text-white">
                                        {user.username}
                                        {isCurrentUser && <span className="text-slate-400 ml-2">(You)</span>}
                                    </span>

                                    {/* DM Icon */}
                                    {!isCurrentUser && (
                                        <MessageCircle size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}

                                    {/* Online indicator */}
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
