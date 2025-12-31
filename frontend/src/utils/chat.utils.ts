// Utility functions for chat
export const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export const isToday = (timestamp: number): boolean => {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

export const groupMessagesByDate = <T extends { timestamp: number }>(
    messages: T[]
): { date: string; messages: T[] }[] => {
    const grouped = new Map<string, T[]>();

    messages.forEach(message => {
        const dateKey = new Date(message.timestamp).toDateString();
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(message);
    });

    return Array.from(grouped.entries()).map(([date, messages]) => ({
        date: formatDate(new Date(date).getTime()),
        messages
    }));
};
