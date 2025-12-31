import type { Message } from '@/types/chat.types';

export const handleChatMessage = (
    data: any,
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
) => {
    setMessages(prev => ({
        ...prev,
        [data.roomId]: [...(prev[data.roomId] || []), {
            id: data.messageId || Date.now().toString(),
            content: data.content,
            senderId: data.userId,
            senderName: data.username,
            timestamp: data.timestamp || Date.now(),
            roomId: data.roomId
        }]
    }));
};

export const handleMessageEdited = (
    data: any,
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
) => {
    setMessages(prev => {
        const newMessages = { ...prev };
        for (const roomId in newMessages) {
            newMessages[roomId] = newMessages[roomId].map(m =>
                m.id === data.messageId
                    ? { ...m, content: data.newContent, isEdited: true }
                    : m
            );
        }
        return newMessages;
    });
};

export const handleMessageDeleted = (
    data: any,
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
) => {
    setMessages(prev => {
        const newMessages = { ...prev };
        for (const roomId in newMessages) {
            newMessages[roomId] = newMessages[roomId].filter(m => m.id !== data.messageId);
        }
        return newMessages;
    });
};

export const handleReactionAdded = (
    data: any,
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
) => {
    setMessages(prev => {
        const newMessages = { ...prev };
        for (const roomId in newMessages) {
            newMessages[roomId] = newMessages[roomId].map(m => {
                if (m.id === data.messageId) {
                    const reactions = m.reactions || [];
                    return {
                        ...m,
                        reactions: [...reactions, {
                            emoji: data.emoji,
                            userId: data.userId,
                            username: data.username
                        }]
                    };
                }
                return m;
            });
        }
        return newMessages;
    });
};

export const handleChatHistory = (
    data: any,
    setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>
) => {
    setMessages(prev => ({
        ...prev,
        [data.roomId]: (data.messages || []).map((m: any) => ({
            id: m.messageId,
            content: m.content,
            senderId: m.userId,
            senderName: m.username,
            timestamp: m.timestamp,
            roomId: m.roomId
        }))
    }));
};
