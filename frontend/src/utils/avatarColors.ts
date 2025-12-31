// Generate consistent avatar color from username
export function getAvatarColor(username: string): string {
    const colors = [
        'from-red-500 to-red-600',
        'from-blue-500 to-blue-600',
        'from-green-500 to-green-600',
        'from-purple-500 to-purple-600',
        'from-pink-500 to-pink-600',
        'from-yellow-500 to-yellow-600',
        'from-indigo-500 to-indigo-600',
        'from-teal-500 to-teal-600',
        'from-orange-500 to-orange-600',
        'from-cyan-500 to-cyan-600'
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export function getInitials(username: string): string {
    return username.charAt(0).toUpperCase();
}
