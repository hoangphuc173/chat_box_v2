import { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
}

export function VoiceRecorder({ onRecordingComplete, onCancel }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>();
    const timerRef = useRef<ReturnType<typeof setInterval>>();

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup audio analyser for visualization
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Start MediaRecorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob, duration);
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            // Start audio level monitoring
            monitorAudioLevel();
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    // Monitor audio level for visualization
    const monitorAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateLevel = () => {
            if (!analyserRef.current || !isRecording) return;

            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(average / 255);

            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            cleanup();
        }
    };

    // Pause/Resume recording
    const togglePause = () => {
        if (!mediaRecorderRef.current) return;

        if (isPaused) {
            mediaRecorderRef.current.resume();
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            mediaRecorderRef.current.pause();
            if (timerRef.current) clearInterval(timerRef.current);
        }
        setIsPaused(!isPaused);
    };

    // Cancel recording
    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        cleanup();
        onCancel();
    };

    // Cleanup resources
    const cleanup = () => {
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    // Format duration as MM:SS
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Generate waveform bars
    const waveformBars = Array.from({ length: 20 }, (_) => {
        const height = isRecording && !isPaused
            ? Math.random() * 0.5 + audioLevel * 0.5
            : 0.1;
        return height;
    });

    return (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            {/* Cancel Button */}
            <button
                onClick={cancelRecording}
                className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 cursor-pointer border-none transition-colors"
                title="Cancel"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Waveform Visualization */}
            <div className="flex-1 flex items-center justify-center gap-0.5 h-10">
                {waveformBars.map((height, i) => (
                    <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, height * 32)}px` }}
                    />
                ))}
            </div>

            {/* Duration */}
            <div className="min-w-[50px] text-red-400 font-mono text-sm font-medium">
                {formatDuration(duration)}
            </div>

            {/* Recording indicator */}
            <div className={`w-3 h-3 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-red-500/50'}`} />

            {/* Control Buttons */}
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="w-12 h-12 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white cursor-pointer border-none transition-colors shadow-lg shadow-red-500/30"
                    title="Start Recording"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </button>
            ) : (
                <>
                    {/* Pause/Resume Button */}
                    <button
                        onClick={togglePause}
                        className="w-10 h-10 flex items-center justify-center bg-amber-500 hover:bg-amber-600 rounded-full text-white cursor-pointer border-none transition-colors"
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        {isPaused ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        )}
                    </button>

                    {/* Stop/Send Button */}
                    <button
                        onClick={stopRecording}
                        className="w-12 h-12 flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full text-white cursor-pointer border-none transition-colors shadow-lg shadow-green-500/30"
                        title="Send Voice Message"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
