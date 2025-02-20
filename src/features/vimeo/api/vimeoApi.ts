import { vimeoClient } from '../utils/vimeoClient';
import { VimeoResponse, VimeoVideo } from '../types/vimeo.types';

interface VimeoError {
  name: string;
  message: string;
  status: number;
}

export const vimeoApi = {
  getVideos: (page: number = 1, perPage: number = 10): Promise<VimeoResponse> => {
    return new Promise((resolve, reject) => {
      vimeoClient.request({
        method: 'GET',
        path: '/me/videos',
        query: {
          page,
          per_page: perPage,
        },
      }, (error: VimeoError | null, body: VimeoResponse) => {
        if (error) reject(error);
        resolve(body);
      });
    });
  },

  uploadVideo: (file: Buffer, name: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      vimeoClient.upload(
        file,
        {
          name,
          description: 'Uploaded via API',
        },
        (uri: string) => resolve(uri),
        (bytes_uploaded: number, bytes_total: number) => {
          const percentage = (bytes_uploaded / bytes_total * 100).toFixed(2);
          console.log(`Upload progress: ${percentage}%`);
        },
        (error: VimeoError) => reject(error)
      );
    });
  },
};