import { useState, useRef, useEffect, useCallback } from 'react';

interface ScreenShareControlsProps {
    isSharing: boolean;
    onStartShare: () => void;
    onStopShare: () => void;
    onError?: (error: string) => void;
}

export function ScreenShareControls({ isSharing, onStartShare, onStopShare, onError: _onError }: ScreenShareControlsProps) {
    return (
        <button
            onClick={isSharing ? onStopShare : onStartShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all border-none cursor-pointer ${isSharing
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                }`}
            title={isSharing ? 'Stop Sharing' : 'Share Screen'}
        >
            {isSharing ? (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                        <line x1="2" y1="3" x2="22" y2="17" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Stop Sharing
                </>
            ) : (
                <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    Share Screen
                </>
            )}
        </button>
    );
}

interface ScreenShareProps {
    peerConnection?: RTCPeerConnection;
    onStreamChange?: (stream: MediaStream | null) => void;
}

export function useScreenShare({ peerConnection, onStreamChange }: ScreenShareProps = {}) {
    const [isSharing, setIsSharing] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const originalTrackRef = useRef<MediaStreamTrack | null>(null);

    const startScreenShare = useCallback(async () => {
        try {
            setError(null);

            // Request screen sharing
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                } as MediaTrackConstraints,
                audio: true
            });

            setStream(displayStream);
            setIsSharing(true);
            onStreamChange?.(displayStream);

            // Replace video track in peer connection if available
            if (peerConnection) {
                const videoTrack = displayStream.getVideoTracks()[0];
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');

                if (videoSender && videoSender.track) {
                    // Save original track for later
                    originalTrackRef.current = videoSender.track;
                    await videoSender.replaceTrack(videoTrack);
                }
            }

            // Handle when user stops sharing via browser UI
            displayStream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

            return displayStream;
        } catch (err: any) {
            const errorMsg = err.name === 'NotAllowedError'
                ? 'Screen sharing permission denied'
                : `Failed to start screen sharing: ${err.message}`;
            setError(errorMsg);
            console.error('Screen share error:', err);
            return null;
        }
    }, [peerConnection, onStreamChange]);

    const stopScreenShare = useCallback(async () => {
        if (stream) {
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());

            // Restore original video track if available
            if (peerConnection && originalTrackRef.current) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');

                if (videoSender) {
                    await videoSender.replaceTrack(originalTrackRef.current);
                }
            }

            setStream(null);
            setIsSharing(false);
            onStreamChange?.(null);
            originalTrackRef.current = null;
        }
    }, [stream, peerConnection, onStreamChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return {
        isSharing,
        stream,
        error,
        startScreenShare,
        stopScreenShare
    };
}

// Screen share preview component
interface ScreenSharePreviewProps {
    stream: MediaStream | null;
    className?: string;
}

export function ScreenSharePreview({ stream, className = '' }: ScreenSharePreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!stream) return null;

    return (
        <div className={`relative rounded-xl overflow-hidden bg-black ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Screen Sharing</span>
            </div>
        </div>
    );
}
