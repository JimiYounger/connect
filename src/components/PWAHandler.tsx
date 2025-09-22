'use client';

import { useEffect } from 'react';
import { usePWAConfig } from '@/hooks/usePWAConfig';

/**
 * PWA Handler Component
 * Single responsibility: Initialize PWA mode class
 * All complex logic moved to dedicated hooks
 */
export default function PWAHandler() {
  const { isStandalone } = usePWAConfig();

  useEffect(() => {
    // Single purpose: Add PWA class to document
    if (isStandalone) {
      document.documentElement.classList.add('pwa-mode');

      // Store PWA state for consistency across reloads
      sessionStorage.setItem('pwa_mode', 'true');
    } else {
      // Check if we were in PWA mode before (page reload/navigation)
      if (sessionStorage.getItem('pwa_mode') === 'true') {
        document.documentElement.classList.add('pwa-mode');
      }
    }

    // Cleanup
    return () => {
      // Only remove if we're sure we're not in PWA anymore
      if (!isStandalone && sessionStorage.getItem('pwa_mode') !== 'true') {
        document.documentElement.classList.remove('pwa-mode');
      }
    };
  }, [isStandalone]);

  return null; // No DOM output
}