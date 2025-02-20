// src/types/tus-js-client.d.ts
declare module 'tus-js-client' {
  export class Upload {
    constructor(
      file: File,
      options: {
        endpoint: string;
        retryDelays?: number[];
        metadata?: {
          filename?: string;
          filetype?: string;
          [key: string]: string | undefined;
        };
        onError?: (error: Error) => void;
        onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
        onSuccess?: () => void;
        onChunkComplete?: (chunkSize: number, bytesAccepted: number, bytesTotal: number) => void;
        chunkSize?: number;
        fingerprint?: (file: File, options?: Record<string, unknown>) => string | Promise<string>;
        uploadUrl?: string | null;
        uploadSize?: number | null;
        overridePatchMethod?: boolean;
        headers?: { [key: string]: string };
        addRequestId?: boolean;
        onBeforeRequest?: (req: Request | Record<string, unknown>) => void;
        onAfterResponse?: (req: Request | Record<string, unknown>, res: Response | Record<string, unknown>) => void;
        parallelUploads?: number;
        storeFingerprintForResuming?: boolean;
        removeFingerprintOnSuccess?: boolean;
        uploadLengthDeferred?: boolean;
        uploadDataDuringCreation?: boolean;
      }
    );

    start(): void;
    abort(shouldTerminate?: boolean): Promise<void>;
    findPreviousUploads(): Promise<Record<string, unknown>[]>;
    resumeFromPreviousUpload(previousUpload: Record<string, unknown>): void;
    url: string | null;
    file: File | null;
    url: string | null;
    options: UploadOptions;
  }

  export interface UploadOptions {
    endpoint: string;
    uploadUrl?: string | null;
    metadata?: { [key: string]: string };
    fingerprint?: (file: File, options?: Record<string, unknown>) => string | Promise<string>;
    uploadSize?: number | null;
    onProgress?: (bytesUploaded: number, bytesTotal: number) => void;
    onChunkComplete?: (chunkSize: number, bytesAccepted: number, bytesTotal: number) => void;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    headers?: { [key: string]: string };
    chunkSize?: number;
    retryDelays?: number[];
    parallelUploads?: number;
    storeFingerprintForResuming?: boolean;
    removeFingerprintOnSuccess?: boolean;
    uploadLengthDeferred?: boolean;
    uploadDataDuringCreation?: boolean;
    overridePatchMethod?: boolean;
    onBeforeRequest?: (req: Request | Record<string, unknown>) => void;
    onAfterResponse?: (req: Request | Record<string, unknown>, res: Response | Record<string, unknown>) => void;
  }
} 