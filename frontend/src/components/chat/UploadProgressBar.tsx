import { X } from 'lucide-react';

interface UploadProgressBarProps {
    fileName: string;
    fileSize: number;
    progress: number;
    isUploading: boolean;
    error?: string | null;
    onCancel?: () => void;
}

export function UploadProgressBar({
    fileName,
    fileSize,
    progress,
    isUploading,
    error,
    onCancel
}: UploadProgressBarProps) {
    if (!isUploading && !error) return null;

    const formatFileSize = (bytes: number): string => {
        if (bytes >= 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        } else if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        } else if (bytes >= 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }
        return `${bytes} bytes`;
    };

    return (
        <div className="fixed bottom-4 right-4 bg-[var(--bg-tertiary)] rounded-lg shadow-2xl border border-[var(--border)] p-4 w-80 z-50 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' :
                            progress === 100 ? 'bg-green-500' :
                                'bg-blue-500 animate-pulse'
                        }`} />
                    <span className="text-white text-sm font-medium">
                        {error ? 'Upload Failed' :
                            progress === 100 ? 'Upload Complete' :
                                'Uploading'}
                    </span>
                </div>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* File Info */}
            <div className="mb-3">
                <p className="text-white text-sm truncate" title={fileName}>
                    {fileName}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                    {formatFileSize(fileSize)}
                </p>
            </div>

            {/* Progress Bar */}
            {!error && (
                <div className="mb-2">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-slate-400 text-xs mt-1 text-right">
                        {progress}%
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}

            {/* Upload Speed (optional enhancement) */}
            {isUploading && !error && progress < 100 && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="flex-1">
                        <div className="flex gap-1">
                            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <span>Processing chunks...</span>
                </div>
            )}
        </div>
    );
}
