'use client';

import { useState, useEffect, useCallback } from 'react';

interface PWAConfig {
  isInstalled: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  viewportHeight: number;
  viewportWidth: number;
  orientation: 'portrait' | 'landscape';
}

/**
 * Hook for managing PWA configuration and state
 * Single responsibility: PWA state management
 *
 * @returns PWA configuration object
 */
export function usePWAConfig(): PWAConfig {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [viewportHeight, setViewportHeight] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Update viewport dimensions
  const updateViewport = useCallback(() => {
    setViewportHeight(window.innerHeight);
    setViewportWidth(window.innerWidth);
    setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

    // Update CSS custom properties for use in styles
    const root = document.documentElement;
    root.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    root.style.setProperty('--viewport-width', `${window.innerWidth}px`);
  }, []);

  // Update safe area insets
  const updateSafeAreaInsets = useCallback(() => {
    // Get safe area insets from CSS env variables
    const computedStyle = window.getComputedStyle(document.documentElement);

    const top = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'
    );
    const bottom = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'
    );
    const left = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'
    );
    const right = parseInt(
      computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'
    );

    setSafeAreaInsets({ top, bottom, left, right });

    // Update CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--safe-area-top', `${top}px`);
    root.style.setProperty('--safe-area-bottom', `${bottom}px`);
    root.style.setProperty('--safe-area-left', `${left}px`);
    root.style.setProperty('--safe-area-right', `${right}px`);
  }, []);

  useEffect(() => {
    // Check if PWA is installed
    const checkInstallation = () => {
      // Check for standalone mode
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);

      // Check if already installed
      const installed = standalone ||
                       document.referrer.includes('android-app://') ||
                       window.location.search.includes('source=pwa');
      setIsInstalled(installed);
    };

    // Check if PWA is installable
    let deferredPrompt: any = null;
    const handleBeforeInstall = (e: Event) => {
      // Prevent default install prompt
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);

      // Store for later use if needed
      (window as any).deferredPrompt = deferredPrompt;
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
      (window as any).deferredPrompt = null;
    };

    // Initial checks
    checkInstallation();
    updateViewport();
    updateSafeAreaInsets();

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    // Check for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkInstallation();
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    // Update on visibility change (for iOS PWA)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateViewport();
        updateSafeAreaInsets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateViewport, updateSafeAreaInsets]);

  return {
    isInstalled,
    isInstallable,
    isStandalone,
    safeAreaInsets,
    viewportHeight,
    viewportWidth,
    orientation,
  };
}

/**
 * Hook to prompt PWA installation
 * Single responsibility: Trigger PWA install prompt
 */
export function usePWAInstallPrompt() {
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      setCanPrompt(!!(window as any).deferredPrompt);
    };

    checkPrompt();
    window.addEventListener('beforeinstallprompt', () => {
      setTimeout(checkPrompt, 100);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', checkPrompt);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) return false;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    (window as any).deferredPrompt = null;
    setCanPrompt(false);

    return outcome === 'accepted';
  }, []);

  return {
    canPrompt,
    promptInstall,
  };
}

/**
 * CSS custom properties for PWA layouts
 * Use these in your CSS: var(--viewport-height), etc.
 */
export const PWA_CSS_VARS = {
  VIEWPORT_HEIGHT: '--viewport-height',
  VIEWPORT_WIDTH: '--viewport-width',
  SAFE_AREA_TOP: '--safe-area-top',
  SAFE_AREA_BOTTOM: '--safe-area-bottom',
  SAFE_AREA_LEFT: '--safe-area-left',
  SAFE_AREA_RIGHT: '--safe-area-right',
} as const;