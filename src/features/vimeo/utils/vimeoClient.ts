import * as tus from 'tus-js-client';

interface UploadResponse {
  upload_link: string;
  uri: string;
}

interface VimeoVideo {
  uri: string;
  name: string;
  description: string;
  link: string;
  duration: number;
  created_time: string;
  pictures: {
    base_link: string;
    sizes: Array<{
      width: number;
      height: number;
      link: string;
    }>;
  };
}

interface VimeoResponse {
  total: number;
  page: number;
  per_page: number;
  paging: {
    next: string | null;
    previous: string | null;
    first: string;
    last: string;
  };
  data: VimeoVideo[];
}

export const vimeoClient = {
  async uploadVideo(file: File, onProgress?: (progress: number) => void) {
    // Step 1: Get upload ticket from our API
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    const response = await fetch('/api/vimeo/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create upload ticket');
    }

    const { upload_link, uri } = await response.json() as UploadResponse;

    // Step 2: Upload the file using tus protocol
    return new Promise<string>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        uploadUrl: upload_link,
        endpoint: upload_link,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 128 * 1024 * 1024, // 128MB chunks
        metadata: {
          filename: file.name,
          filetype: file.type
        },
        onError: (error: Error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        onProgress: (bytesUploaded: number, bytesTotal: number) => {
          const percentage = (bytesUploaded / bytesTotal * 100);
          console.log(percentage.toFixed(2) + '%');
          onProgress?.(percentage);
        },
        onSuccess: () => {
          onProgress?.(100);
          resolve(uri);
        }
      });

      upload.start();
    });
  },

  async getVideos(options: {
    page?: number;
    perPage?: number;
    query?: string;
    sort?: 'date' | 'name' | 'duration' | 'default';
  } = {}) {
    const { page = 1, perPage = 10, query, sort = 'date' } = options;
    
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: sort,
      direction: 'desc'
    });

    if (query) {
      params.append('query', query);
    }

    const response = await fetch(
      `/api/vimeo/videos?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    return response.json() as Promise<VimeoResponse>;
  }
};

export type { VimeoVideo, VimeoResponse };