export interface AudioFile {
  id: string;
  title: string;
  description?: string;
  audio_series_id?: string;
  created_by: string;
  created_at: string;
  current_version_id?: string;
  embedding_status?: 'pending' | 'processing' | 'complete' | 'failed';
}

export interface AudioVersion {
  id: string;
  audio_file_id: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  version_label?: string;
}

export interface AudioTranscript {
  id: string;
  audio_file_id: string;
  content: string; // Updated from full_transcript to content
  created_at: string;
}

export interface AudioChunk {
  id: string;
  audio_file_id: string;
  chunk_index: number;
  start_time: number;
  end_time: number;
  content: string;
  created_at: string;
}

export interface UploadAudioRequest {
  title: string;
  description?: string;
  audio_series_id?: string;
  file_url: string;
  file_path: string; // Internal storage path for backend processing
  file_type: string;
  user_id: string;
}

export interface UploadAudioResponse {
  success: boolean;
  audioFileId: string;
}

export interface ParseAudioRequest {
  audio_file_id: string;
}

export interface ParseAudioResponse {
  success: boolean;
  chunkCount?: number;
  error?: string;
}