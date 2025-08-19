'use client';

import useSWR from 'swr';
import MuxPlayer from '@mux/mux-player-react';
import type { LiveStatus } from '../getLiveStatus';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LivePlayer() {
  const { data, error, isLoading } = useSWR<LiveStatus>(
    '/api/mux/live',
    fetcher,
    { 
      refreshInterval: 10_000, // Poll every 10 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
          <p className="text-slate-600">Checking live status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-medium">Error loading live stream</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (!data?.isLive) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Stream Offline</h3>
          <p className="text-slate-300">We&apos;ll be live soon. This page will automatically update when the stream starts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video">
      <MuxPlayer
        streamType="ll-live"
        playbackId={data.playbackId}
        autoPlay="any"
        className="w-full h-full rounded-lg"
        targetLiveWindow={30}
        metadata={{
          video_title: "P3 Live Stream",
        }}
      />
    </div>
  );
} 