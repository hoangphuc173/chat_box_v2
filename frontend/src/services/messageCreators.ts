// WebSocket action creators for cleaner code

export function createChatMessage(roomId: string, content: string) {
    return JSON.stringify({
        type: 'chat',
        roomId,
        content,
        timestamp: Date.now()
    });
}

export function createEditMessage(messageId: string, content: string) {
    return JSON.stringify({
        type: 'edit_message',
        messageId,
        content
    });
}

export function createDeleteMessage(messageId: string) {
    return JSON.stringify({
        type: 'delete_message',
        messageId
    });
}

export function createReaction(messageId: string, emoji: string) {
    return JSON.stringify({
        type: 'reaction',
        messageId,
        emoji
    });
}

export function createJoinRoom(roomId: string) {
    return JSON.stringify({
        type: 'join_room',
        roomId
    });
}

export function createLeaveRoom(roomId: string) {
    return JSON.stringify({
        type: 'leave_room',
        roomId
    });
}

export function createRoomMessage(name: string) {
    return JSON.stringify({
        type: 'create_room',
        name
    });
}

export function createTypingIndicator(roomId: string, isTyping: boolean) {
    return JSON.stringify({
        type: isTyping ? 'typing_start' : 'typing_stop',
        roomId
    });
}

export function createPresenceUpdate(status: 'online' | 'away' | 'dnd' | 'invisible') {
    return JSON.stringify({
        type: 'presence',
        status
    });
}

export function createCallInit(targetUserId: string, callType: 'audio' | 'video') {
    return JSON.stringify({
        type: 'call_init',
        targetUserId,
        callType
    });
}

export function createCallAccept(callId: string) {
    return JSON.stringify({
        type: 'call_accept',
        callId
    });
}

export function createCallReject(callId: string) {
    return JSON.stringify({
        type: 'call_reject',
        callId
    });
}

export function createCallEnd(callId: string) {
    return JSON.stringify({
        type: 'call_end',
        callId
    });
}

export function createAIMessage(message: string, conversationHistory: any[]) {
    return JSON.stringify({
        type: 'ai_chat',
        message,
        history: conversationHistory
    });
}

export function createPoll(roomId: string, question: string, options: string[]) {
    return JSON.stringify({
        type: 'poll_create',
        roomId,
        question,
        options
    });
}

export function createPollVote(pollId: string, optionId: string) {
    return JSON.stringify({
        type: 'poll_vote',
        pollId,
        optionId
    });
}

export function createGameInvite(targetUserId: string, gameType: 'tictactoe' | 'chess') {
    return JSON.stringify({
        type: 'game_invite',
        targetUserId,
        gameType
    });
}

export function createGameMove(gameId: string, move: any) {
    return JSON.stringify({
        type: 'game_move',
        gameId,
        move
    });
}

export function createWatchSession(videoUrl: string) {
    return JSON.stringify({
        type: 'watch_create',
        videoUrl
    });
}

export function createWatchSync(timestamp: number, isPlaying: boolean) {
    return JSON.stringify({
        type: 'watch_sync',
        timestamp,
        isPlaying
    });
}
