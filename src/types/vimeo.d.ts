// src/types/vimeo.d.ts

declare module '@vimeo/vimeo' {
  interface VimeoRequestOptions {
    method: string;
    path: string;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
  }

  interface VimeoUploadOptions {
    name: string;
    description?: string;
    privacy?: {
      view: 'anybody' | 'nobody' | 'password' | 'disable' | 'unlisted';
      embed?: 'public' | 'private' | 'whitelist';
      comments?: 'anybody' | 'nobody';
      download?: boolean;
    };
  }

  class Vimeo {
    constructor(
      clientId: string | undefined,
      clientSecret: string | undefined,
      accessToken: string | undefined
    );

    request(
      options: VimeoRequestOptions,
      callback: (error: any, body: any, statusCode?: number, headers?: object) => void
    ): void;

    upload(
      file: Buffer | string,
      options: VimeoUploadOptions,
      completeCallback: (uri: string) => void,
      progressCallback?: (bytesUploaded: number, bytesTotal: number) => void,
      errorCallback?: (error: any) => void
    ): void;
  }

  export interface VimeoVideo {
    uri: string
    name: string
    description: string
    duration: number
    created_time: string
    pictures: {
      sizes: Array<{
        width: number
        link: string
      }>
    }
  }

  export = Vimeo;
} 