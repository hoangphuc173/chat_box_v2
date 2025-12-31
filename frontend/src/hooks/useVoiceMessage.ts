import { useState, useCallback } from 'react';
import { useFileUpload } from './useFileUpload';

export interface VoiceMessageData {
    audioBlob: Blob;
    duration: number;
    waveform?: number[];
}

export function useVoiceMessage(websocket?: WebSocket) {
    const { uploadFile, uploadProgress, isUploading, uploadError } = useFileUpload(websocket);
    const [isRecording, setIsRecording] = useState(false);

    const sendVoiceMessage = useCallback(async (
        voiceData: VoiceMessageData,
        onSendMessage: (content: string, metadata?: any) => void
    ) => {
        //  Create a File object from the Blob for potential future use
        new File(
            [voiceData.audioBlob],
            `voice_${Date.now()}.webm`,
            { type: 'audio/webm' }
        );

        // Simulate file selection (will trigger upload)
        // We'll need to modify useFileUpload to accept direct File objects
        // For now, upload via uploadFile with metadata
        try {
            setIsRecording(false);

            // Upload and send with voice metadata
            await uploadFile((content, metadata) => {
                onSendMessage(content, {
                    ...metadata,
                    type: 'voice',
                    duration: voiceData.duration,
                    waveform: voiceData.waveform || []
                });
            });
        } catch (error) {
            console.error('Failed to send voice message:', error);
            throw error;
        }
    }, [uploadFile]);

    return {
        sendVoiceMessage,
        isRecording,
        setIsRecording,
        uploadProgress,
        isUploading,
        uploadError
    };
}
