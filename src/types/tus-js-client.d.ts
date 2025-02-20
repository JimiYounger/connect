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
        fingerprint?: (file: File, options?: any) => string | Promise<string>;
        uploadUrl?: string | null;
        uploadSize?: number | null;
        overridePatchMethod?: boolean;
        headers?: { [key: string]: string };
        addRequestId?: boolean;
        onBeforeRequest?: (req: any) => void;
        onAfterResponse?: (req: any, res: any) => void;
        parallelUploads?: number;
        storeFingerprintForResuming?: boolean;
        removeFingerprintOnSuccess?: boolean;
        uploadLengthDeferred?: boolean;
        uploadDataDuringCreation?: boolean;
      }
    );

    start(): void;
    abort(shouldTerminate?: boolean): Promise<void>;
    findPreviousUploads(): Promise<any[]>;
    resumeFromPreviousUpload(previousUpload: any): void;
    url: string | null;
    file: File | null;
    url: string | null;
    options: any;
  }

  export interface UploadOptions {
    endpoint: string;
    uploadUrl?: string | null;
    metadata?: { [key: string]: string };
    fingerprint?: (file: File, options?: any) => string | Promise<string>;
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
    onBeforeRequest?: (req: any) => void;
    onAfterResponse?: (req: any, res: any) => void;
  }
} 