import { useState, useRef, useEffect } from 'react';

interface VoiceMessageProps {
    audioUrl: string;
    duration?: number;
    senderName: string;
    timestamp: number;
}

export function VoiceMessage({ audioUrl, duration: initialDuration, senderName: _senderName, timestamp: _timestamp }: VoiceMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlayback = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * duration;
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.5, 2];
        const currentIndex = rates.indexOf(playbackRate);
        const nextRate = rates[(currentIndex + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Generate static waveform bars (would be replaced with actual audio waveform data)
    const waveformBars = Array.from({ length: 30 }, (_, i) => {
        // Create a pseudo-random pattern
        const base = Math.sin(i * 0.5) * 0.3 + 0.5;
        const variation = Math.sin(i * 1.7) * 0.2;
        return Math.max(0.2, Math.min(1, base + variation));
    });

    return (
        <div className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl min-w-[280px] max-w-[320px]">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlayback}
                className="w-10 h-10 flex items-center justify-center bg-violet-500 hover:bg-violet-600 rounded-full text-white cursor-pointer border-none transition-colors shrink-0 shadow-lg shadow-violet-500/30"
            >
                {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                )}
            </button>

            {/* Waveform & Progress */}
            <div className="flex-1 flex flex-col gap-1">
                {/* Waveform with progress overlay */}
                <div
                    className="flex items-center gap-0.5 h-8 cursor-pointer"
                    onClick={handleSeek}
                >
                    {waveformBars.map((height, i) => {
                        const barProgress = (i / waveformBars.length) * 100;
                        const isPlayed = barProgress <= progress;
                        return (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-colors ${isPlayed ? 'bg-violet-500' : 'bg-violet-500/30'
                                    }`}
                                style={{ height: `${height * 28}px` }}
                            />
                        );
                    })}
                </div>

                {/* Time & Controls */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <button
                        onClick={cyclePlaybackRate}
                        className="px-1.5 py-0.5 text-[10px] font-bold text-violet-400 bg-violet-500/20 rounded border-none cursor-pointer hover:bg-violet-500/30"
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>

            {/* Microphone Icon */}
            <div className="w-8 h-8 flex items-center justify-center text-violet-400 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
            </div>
        </div>
    );
}
