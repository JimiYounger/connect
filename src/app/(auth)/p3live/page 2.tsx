import LivePlayer from '@/features/mux/components/LivePlayer';

export const metadata = { title: 'P3 Live' };

export default function P3Live() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-3xl font-bold">P3 Live</h1>
      <LivePlayer />
    </main>
  );
} 