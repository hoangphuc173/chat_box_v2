// ============================================================================
// CHATBOX1 TYPES - TypeScript Interfaces
// Synced with: backend/server/include/protocol_chatbox1.h
// ============================================================================

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
    messageId: string;
    roomId: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    isHistory?: boolean;
    editedAt?: number;
    isDeleted?: boolean;
    isRead?: boolean;
    isPinned?: boolean;
    replyToId?: string;
    reactions?: Reaction[];
    metadata?: MessageMetadata;
}

export interface MessageMetadata {
    type?: 'file' | 'image' | 'voice' | 'video' | 'sticker' | 'location' | 'contact';
    url?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    thumbnailUrl?: string;
    latitude?: number;
    longitude?: number;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
    userId: string;
    username: string;
    email?: string;
    avatar?: string;
    online?: boolean;
    role?: 'admin' | 'moderator' | 'member' | 'guest';
    status?: UserPresenceStatus;
    statusMessage?: string;
}

export type UserPresenceStatus = 'online' | 'away' | 'dnd' | 'invisible' | 'offline';

export interface TypingUser {
    id: string;
    username: string;
    roomId: string;
}

// ============================================================================
// ROOM TYPES
// ============================================================================

export interface Room {
    roomId: string;
    roomName: string;
    roomType: 'public' | 'private' | 'dm';
    unread?: number;
    lastMessage?: string;
    lastMessageTime?: number;
    memberCount?: number;
}

// ============================================================================
// REACTION TYPES
// ============================================================================

export interface Reaction {
    emoji: string;
    userId: string;
    username: string;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    createdBy: string;
    createdAt: number;
    isClosed: boolean;
    roomId: string;
}

export interface PollOption {
    id: string;
    text: string;
    votes: number;
    voters: string[];
}

// ============================================================================
// GAME TYPES
// ============================================================================

export interface GameState {
    id: string;
    type: 'tictactoe' | 'chess' | 'checkers';
    board: any[];
    currentTurn: string;
    players: { X?: string; O?: string; white?: string; black?: string };
    winner: string | null;
    status: 'waiting' | 'playing' | 'finished';
}

export interface GameInvite {
    gameId: string;
    gameType: 'tictactoe' | 'chess' | 'checkers';
    inviterId: string;
    inviterName: string;
}

// ============================================================================
// WATCH TOGETHER TYPES
// ============================================================================

export interface WatchSession {
    sessionId: string;
    videoUrl: string;
    currentTime: number;
    isPlaying: boolean;
    viewerCount: number;
    hostId: string;
}

// ============================================================================
// AI BOT TYPES
// ============================================================================

export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AIConversation {
    conversationId: string;
    messages: AIMessage[];
}

// ============================================================================
// FILE TRANSFER TYPES
// ============================================================================

export interface FileTransfer {
    transferId: string;
    filename: string;
    fileSize: number;
    fileType: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
    url?: string;
}

// ============================================================================
// WEBRTC CALL TYPES
// ============================================================================

export interface CallState {
    callId: string;
    callType: 'audio' | 'video';
    callerId: string;
    callerName?: string;
    calleeId: string;
    status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface LoginResponse {
    type: 'login_response';
    success: boolean;
    token?: string;
    userId?: string;
    username?: string;
    message: string;
}

export interface RegisterResponse {
    type: 'register_response';
    success: boolean;
    message: string;
}

export interface HistoryResponse {
    type: 'history';
    roomId: string;
    messages: Message[];
}

export interface ChatResponse {
    type: 'chat';
    messageId: string;
    roomId: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
    metadata?: MessageMetadata;
}

export interface ErrorResponse {
    type: 'error';
    message: string;
    code?: number;
}

export interface MessageEditedResponse {
    type: 'message_edited';
    messageId: string;
    newContent: string;
    editedAt: number;
    userId: string;
}

export interface MessageDeletedResponse {
    type: 'message_deleted';
    messageId: string;
    userId: string;
}

export interface RoomCreatedResponse {
    type: 'room_created';
    roomId: string;
    roomName: string;
    roomType: string;
}

export interface RoomJoinedResponse {
    type: 'room_joined';
    roomId: string;
    userId: string;
    username: string;
}

export interface RoomListResponse {
    type: 'room_list';
    rooms: Room[];
}

// ============================================================================
// CONNECTION TYPES
// ============================================================================

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
