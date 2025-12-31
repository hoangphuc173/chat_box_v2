import { create } from 'zustand'
import type { Message, ConnectionStatus, Room } from '../types'

interface OnlineUser {
    userId: string
    username: string
}

interface TypingUser {
    userId: string
    username: string
}

interface ChatState {
    messages: Message[]
    connectionStatus: ConnectionStatus
    currentRoom: string
    rooms: Room[]
    onlineUsers: OnlineUser[]
    typingUsers: TypingUser[]
}

interface ChatActions {
    addMessage: (message: Message) => void
    setHistory: (messages: Message[]) => void
    clearMessages: () => void
    updateMessage: (messageId: string, newContent: string, editedAt: number) => void
    deleteMessage: (messageId: string) => void
    setConnectionStatus: (status: ConnectionStatus) => void
    setCurrentRoom: (roomId: string) => void

    // Rooms
    setRooms: (rooms: Room[]) => void
    addRoom: (room: Room) => void

    // Online users
    addOnlineUser: (user: OnlineUser) => void
    removeOnlineUser: (userId: string) => void
    setOnlineUsers: (users: OnlineUser[]) => void

    // Typing users
    addTypingUser: (user: TypingUser) => void
    removeTypingUser: (userId: string) => void
}

export const useChatStore = create<ChatState & ChatActions>((set) => ({
    // State
    messages: [],
    connectionStatus: 'disconnected',
    currentRoom: 'global',
    rooms: [],
    onlineUsers: [],
    typingUsers: [],

    // Message actions
    addMessage: (message) =>
        set((state) => ({
            messages: [...state.messages, message]
        })),

    setHistory: (messages) =>
        set(() => ({
            messages: messages.map(msg => ({ ...msg, isHistory: true }))
        })),

    clearMessages: () =>
        set(() => ({
            messages: []
        })),

    updateMessage: (messageId: string, newContent: string, editedAt: number) =>
        set((state) => ({
            messages: state.messages.map(msg =>
                msg.messageId === messageId
                    ? { ...msg, content: newContent, editedAt }
                    : msg
            )
        })),

    deleteMessage: (messageId: string) =>
        set((state) => ({
            messages: state.messages.map(msg =>
                msg.messageId === messageId
                    ? { ...msg, isDeleted: true }
                    : msg
            )
        })),

    setConnectionStatus: (status) =>
        set(() => ({
            connectionStatus: status
        })),

    setCurrentRoom: (roomId) =>
        set(() => ({
            currentRoom: roomId
        })),

    // Rooms actions
    setRooms: (rooms) =>
        set(() => ({
            rooms
        })),

    addRoom: (room) =>
        set((state) => ({
            rooms: [...state.rooms, room]
        })),

    // Online users actions
    addOnlineUser: (user) =>
        set((state) => {
            // Don't add if already exists
            if (state.onlineUsers.some(u => u.userId === user.userId)) {
                return state
            }
            return {
                onlineUsers: [...state.onlineUsers, user]
            }
        }),

    removeOnlineUser: (userId) =>
        set((state) => ({
            onlineUsers: state.onlineUsers.filter(u => u.userId !== userId)
        })),

    setOnlineUsers: (users) =>
        set(() => ({
            onlineUsers: users
        })),

    // Typing users actions
    addTypingUser: (user) =>
        set((state) => {
            // Don't add if already exists
            if (state.typingUsers.some(u => u.userId === user.userId)) {
                return state
            }
            return {
                typingUsers: [...state.typingUsers, user]
            }
        }),

    removeTypingUser: (userId) =>
        set((state) => ({
            typingUsers: state.typingUsers.filter(u => u.userId !== userId)
        }))
}))
