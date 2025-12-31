import { getAvatarColor, getInitials } from '@/utils/avatarColors'

interface AvatarProps {
    username: string
    size?: 'sm' | 'md' | 'lg'
    imageUrl?: string
}

export function Avatar({ username, size = 'md', imageUrl }: AvatarProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg'
    };

    const gradientClass = `bg-gradient-to-br ${getAvatarColor(username)}`;

    if (imageUrl && imageUrl.trim() !== "") {
        return (
            <img
                src={imageUrl}
                alt={username}
                className={`${sizeClasses[size]} rounded-full object-cover shadow-lg border-2 border-slate-700`}
            />
        );
    }

    return (
        <div
            className={`${sizeClasses[size]} ${gradientClass} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
        >
            {getInitials(username)}
        </div>
    );
}
