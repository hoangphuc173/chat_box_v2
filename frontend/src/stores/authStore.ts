import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
    isAuthenticated: boolean
    userId: string | null
    username: string | null
    token: string | null
    sessionId: string | null
    avatarUrl: string | null

    login: (userId: string, username: string, token: string, sessionId: string, avatarUrl?: string) => void
    logout: () => void
    setAvatarUrl: (url: string) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            userId: null,
            username: null,
            token: null,
            sessionId: null,
            avatarUrl: null,

            login: (userId, username, token, sessionId, avatarUrl = '') =>
                set({
                    isAuthenticated: true,
                    userId,
                    username,
                    token,
                    sessionId,
                    avatarUrl,
                }),

            logout: () =>
                set({
                    isAuthenticated: false,
                    userId: null,
                    username: null,
                    token: null,
                    sessionId: null,
                    avatarUrl: null,
                }),

            setAvatarUrl: (url) => set({ avatarUrl: url })
        }),
        {
            name: 'auth-storage',
        }
    )
)
