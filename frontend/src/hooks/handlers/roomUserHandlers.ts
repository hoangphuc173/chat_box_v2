import type { Room, User } from '@/types/chat.types';

export const handleRoomList = (
    data: any,
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>
) => {
    setRooms(data.rooms || []);
};

export const handleRoomCreated = (
    data: any,
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>
) => {
    setRooms(prev => [...prev, {
        id: data.roomId,
        name: data.roomName
    }]);
};

export const handleUserList = (
    data: any,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
) => {
    setUsers(data.users || []);
};

export const handleUserJoined = (
    data: any,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
) => {
    setUsers(prev => [...prev.filter(u => u.id !== data.userId), {
        id: data.userId,
        username: data.username,
        online: true
    }]);
};

export const handleUserLeft = (
    data: any,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
) => {
    setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, online: false } : u
    ));
};

export const handlePresenceUpdate = (
    data: any,
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
) => {
    setUsers(prev => prev.map(u =>
        u.id === data.userId ? { ...u, status: data.status } : u
    ));
};
