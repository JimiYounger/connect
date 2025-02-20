import { useState, useCallback } from 'react';
import { VimeoVideo } from '../types/vimeo.types';
import { vimeoApi } from '../api/vimeoApi';

export const useVimeo = () => {
  const [videos, setVideos] = useState<VimeoVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await vimeoApi.getVideos(page);
      setVideos(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadVideo = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const buffer = Buffer.from(await file.arrayBuffer());
      const uri = await vimeoApi.uploadVideo(buffer, file.name);
      await fetchVideos(); // Refresh the video list
      return uri;
    } catch (err) {
      setError('Failed to upload video');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    fetchVideos,
    uploadVideo,
  };
};