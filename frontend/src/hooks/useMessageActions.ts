import { useState, useCallback } from 'react';
import type { Message } from '@/types/chat.types';

export function useMessageEditing() {
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const startEditing = useCallback((messageId: string, content: string) => {
        setEditingMessageId(messageId);
        setEditContent(content);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingMessageId(null);
        setEditContent('');
    }, []);

    const saveEdit = useCallback((onEdit?: (messageId: string, content: string) => void) => {
        if (editingMessageId && editContent.trim() && onEdit) {
            onEdit(editingMessageId, editContent.trim());
            cancelEditing();
        }
    }, [editingMessageId, editContent, cancelEditing]);

    return {
        editingMessageId,
        editContent,
        setEditContent,
        startEditing,
        cancelEditing,
        saveEdit
    };
}

export function useMessageActions(currentUser: { id: string } | null) {
    const isOwnMessage = useCallback((message: Message) => {
        return message.senderId === currentUser?.id;
    }, [currentUser]);

    const canEditMessage = useCallback((message: Message) => {
        return isOwnMessage(message) && !message.isDeleted;
    }, [isOwnMessage]);

    const canDeleteMessage = useCallback((message: Message) => {
        return isOwnMessage(message) && !message.isDeleted;
    }, [isOwnMessage]);

    return {
        isOwnMessage,
        canEditMessage,
        canDeleteMessage
    };
}

export function useReactions() {
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

    const toggleReactionPicker = useCallback((messageId: string) => {
        setShowReactionPicker(prev => prev === messageId ? null : messageId);
    }, []);

    const closeReactionPicker = useCallback(() => {
        setShowReactionPicker(null);
    }, []);

    return {
        showReactionPicker,
        toggleReactionPicker,
        closeReactionPicker,
        setShowReactionPicker
    };
}
