import type { TypingUser } from '@/types/chat.types';

interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const handleTypingStart = (
    data: any,
    setTypingUsers: React.Dispatch<React.SetStateAction<TypingUser[]>>
) => {
    setTypingUsers(prev => {
        if (prev.find(u => u.id === data.userId)) return prev;
        return [...prev, {
            id: data.userId,
            username: data.username,
            roomId: data.roomId
        }];
    });
};

export const handleTypingStop = (
    data: any,
    setTypingUsers: React.Dispatch<React.SetStateAction<TypingUser[]>>
) => {
    setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
};

export const handleAIResponse = (
    data: any,
    setAiLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setAiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>
) => {
    setAiLoading(false);
    setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        timestamp: Date.now()
    }]);
};

export const handleAIError = (
    setAiLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setAiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>
) => {
    setAiLoading(false);
    setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
    }]);
};
