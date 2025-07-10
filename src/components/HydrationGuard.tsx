'use client';

import { useEffect, useState } from 'react';

interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function HydrationGuard({ children, fallback }: HydrationGuardProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return fallback || (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}