/**
 * Types for the audio upload feature
 */

/**
 * Request body for the audio upload API endpoint
 */
export type UploadAudioRequest = {
  title: string;
  description?: string;
  audio_series_id?: string;
  file_url: string; // Public URL for client-side playback
  file_path: string; // Internal storage path for backend processing
  file_type: string;
  user_id: string;
};

/**
 * Response from the audio upload API endpoint
 */
export type UploadAudioResponse = {
  success: boolean;
  audioFileId?: string;
  error?: string;
};

/**
 * Form values for the audio upload form
 */
export type AudioUploadFormValues = {
  title: string;
  description?: string;
  audio_series_id?: string;
  file: File | null;
};