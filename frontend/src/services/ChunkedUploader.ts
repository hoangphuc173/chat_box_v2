/**
 * ChunkedUploader - Service for uploading large files in chunks
 * Supports progress tracking, pause/resume, and error recovery
 */

export interface UploadProgress {
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    percentage: number;
    status: 'uploading' | 'paused' | 'completed' | 'error';
    error?: string;
}

export interface ChunkedUploaderOptions {
    chunkSize?: number; // Default 1MB
    maxRetries?: number; // Default 3
    roomId?: string; // Room ID for upload
    onProgress?: (progress: UploadProgress) => void;
    onComplete?: (fileUrl: string) => void;
    onError?: (error: Error) => void;
}

export class ChunkedUploader {
    private chunkSize: number;
    private maxRetries: number;
    private ws: WebSocket | null = null;
    private currentUpload: UploadProgress | null = null;
    private isPaused: boolean = false;
    private options: ChunkedUploaderOptions;

    constructor(websocket: WebSocket, options: ChunkedUploaderOptions = {}) {
        this.ws = websocket;
        this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB default
        this.maxRetries = options.maxRetries || 3;
        this.options = options;
    }

    /**
     * Upload a file with chunking
     */
    async upload(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            this.isPaused = false;

            // Initialize upload
            const uploadId = this.generateUploadId();
            const totalChunks = Math.ceil(file.size / this.chunkSize);

            this.currentUpload = {
                uploadId,
                fileName: file.name,
                fileSize: file.size,
                uploadedBytes: 0,
                percentage: 0,
                status: 'uploading'
            };

            // Send init message
            this.sendMessage({
                type: 'upload_init',
                uploadId,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                chunkSize: this.chunkSize,
                totalChunks,
                roomId: this.options.roomId || 'global'
            });

            // Setup message listener
            const messageHandler = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'upload_ready' && data.uploadId === uploadId) {
                        // Start uploading chunks
                        this.uploadChunks(file, uploadId, totalChunks)
                            .then(() => {
                                this.ws?.removeEventListener('message', messageHandler);
                            })
                            .catch(reject);
                    } else if (data.type === 'upload_progress' && data.uploadId === uploadId) {
                        // Update progress
                        if (this.currentUpload) {
                            this.currentUpload.percentage = data.progress;
                            this.currentUpload.uploadedBytes = (data.progress / 100) * file.size;
                            this.options.onProgress?.(this.currentUpload);
                        }
                    } else if (data.type === 'upload_complete' && data.uploadId === uploadId) {
                        // Upload completed
                        if (this.currentUpload) {
                            this.currentUpload.status = 'completed';
                            this.currentUpload.percentage = 100;
                            this.options.onProgress?.(this.currentUpload);
                        }
                        this.options.onComplete?.(data.fileUrl);
                        this.ws?.removeEventListener('message', messageHandler);
                        resolve(data.fileUrl);
                    } else if (data.type === 'upload_error' && data.uploadId === uploadId) {
                        // Upload error
                        if (this.currentUpload) {
                            this.currentUpload.status = 'error';
                            this.currentUpload.error = data.message;
                        }
                        const error = new Error(data.message || 'Upload failed');
                        this.options.onError?.(error);
                        this.ws?.removeEventListener('message', messageHandler);
                        reject(error);
                    }
                } catch (err) {
                    console.error('Error parsing upload message:', err);
                }
            };

            this.ws?.addEventListener('message', messageHandler);
        });
    }

    /**
     * Upload file chunks sequentially
     */
    private async uploadChunks(file: File, uploadId: string, totalChunks: number): Promise<void> {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            if (this.isPaused) {
                throw new Error('Upload paused');
            }

            const start = chunkIndex * this.chunkSize;
            const end = Math.min(start + this.chunkSize, file.size);
            const chunk = file.slice(start, end);

            await this.uploadChunkWithRetry(uploadId, chunkIndex, chunk, totalChunks);
        }

        // Finalize upload
        this.sendMessage({
            type: 'upload_finalize',
            uploadId
        });
    }

    /**
     * Upload a single chunk with retry logic
     */
    private async uploadChunkWithRetry(
        uploadId: string,
        chunkIndex: number,
        chunk: Blob,
        totalChunks: number,
        attempt: number = 0
    ): Promise<void> {
        try {
            const base64Chunk = await this.blobToBase64(chunk);

            this.sendMessage({
                type: 'upload_chunk',
                uploadId,
                chunkIndex,
                chunkData: base64Chunk,
                totalChunks
            });

            // Wait for chunk acknowledgment (optional, can be async)
            await this.delay(10);
        } catch (error) {
            if (attempt < this.maxRetries) {
                console.warn(`Chunk ${chunkIndex} failed, retrying (${attempt + 1}/${this.maxRetries})`);
                await this.delay(1000 * (attempt + 1)); // Exponential backoff
                return this.uploadChunkWithRetry(uploadId, chunkIndex, chunk, totalChunks, attempt + 1);
            } else {
                throw error;
            }
        }
    }

    /**
     * Pause current upload
     */
    pause(): void {
        this.isPaused = true;
        if (this.currentUpload) {
            this.currentUpload.status = 'paused';
            this.options.onProgress?.(this.currentUpload);
        }
    }

    /**
     * Resume paused upload
     */
    resume(): void {
        this.isPaused = false;
        if (this.currentUpload) {
            this.currentUpload.status = 'uploading';
            this.options.onProgress?.(this.currentUpload);
        }
    }

    /**
     * Convert Blob to Base64
     */
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Send message via WebSocket
     */
    private sendMessage(data: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    /**
     * Generate unique upload ID
     */
    private generateUploadId(): string {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
