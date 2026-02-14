
export enum FileCategory {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  TEXT = 'TEXT',
  ARCHIVE = 'ARCHIVE',
  UNKNOWN = 'UNKNOWN'
}

export interface CompressionStrategy {
  quality: number; // 0 to 1
  scale?: number;  // 0 to 1
  bitrate?: number; // kbps
  method: string;
  reasoning: string;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  format: string;
  strategyUsed: CompressionStrategy;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  category: FileCategory;
  previewUrl?: string;
}

export interface AppState {
  file: File | null;
  metadata: FileMetadata | null;
  targetSize: number; // in bytes
  isProcessing: boolean;
  progress: number;
  result: CompressionResult | null;
  error: string | null;
  iteration: number;
}
