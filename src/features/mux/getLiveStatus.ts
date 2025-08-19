import { muxClient } from './muxClient';

export interface LiveStatus {
  isLive: boolean;
  playbackId: string;
}

/**
 * Pure function to get live stream status from Mux
 * @returns Promise<LiveStatus> - Object containing live status and playback ID
 */
export async function getLiveStatus(): Promise<LiveStatus> {
  try {
    const streamId = process.env.MUX_STREAM_ID!;
    const playbackId = process.env.MUX_PLAYBACK_ID!;
    
    // Retrieve live stream details from Mux
    const liveStream = await muxClient.video.liveStreams.retrieve(streamId);
    
    // Check if stream is active (live)
    const isLive = liveStream.status === 'active';
    
    return {
      isLive,
      playbackId,
    };
  } catch (error) {
    console.error('Error retrieving live stream status:', error);
    
    // Return safe defaults on error
    return {
      isLive: false,
      playbackId: process.env.MUX_PLAYBACK_ID!,
    };
  }
} 