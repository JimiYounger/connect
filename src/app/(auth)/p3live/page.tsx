import LivePlayer from '@/features/mux/components/LivePlayer';

export const metadata = { 
  title: 'P3 Live',
  description: 'P3 Live Stream',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
};

export default function P3Live() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Compact header for mobile */}
      <header className="relative z-20 p-4 md:p-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a 
              href="/home"
              className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-colors group touch-manipulation"
              aria-label="Go back to home"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">P3 Live</h1>
          </div>
          <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm px-2.5 md:px-3 py-1 md:py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-xs md:text-sm font-medium">LIVE</span>
          </div>
        </div>
      </header>

      {/* Full-screen player optimized for mobile */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-full max-h-[calc(100vh-80px)] md:max-h-none md:max-w-6xl md:h-auto">
            <LivePlayer />
          </div>
        </div>
      </main>
    </div>
  );
} 