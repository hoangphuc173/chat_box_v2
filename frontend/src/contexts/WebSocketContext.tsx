import { createContext, useContext, ReactNode } from 'react';
import { useWebSocket as useWebSocketHook } from '@/hooks/useWebSocket';

// Get the return type of useWebSocket hook
type WebSocketContextType = ReturnType<typeof useWebSocketHook>;

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const websocket = useWebSocketHook();
    
    return (
        <WebSocketContext.Provider value={websocket}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket(): WebSocketContextType {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
