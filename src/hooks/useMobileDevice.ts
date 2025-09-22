'use client';

import { useState, useEffect } from 'react';

/**
 * Hook for detecting mobile device characteristics
 * Single responsibility: Device detection only
 *
 * @returns Object with device information
 */
export function useMobileDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'small' | 'medium' | 'large'>('large');

  useEffect(() => {
    // Function to detect device characteristics
    const detectDevice = () => {
      // Touch capability detection
      const hasTouch = 'ontouchstart' in window ||
                      navigator.maxTouchPoints > 0 ||
                      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      setIsTouchDevice(hasTouch);

      // PWA detection
      const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');
      setIsPWA(isPWAMode);

      // iOS detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) ||
                         (navigator.userAgentData?.platform === 'macOS' && hasTouch) ||
                         (/Mac/.test(navigator.userAgent) && hasTouch);
      setIsIOS(isIOSDevice);

      // Android detection
      const isAndroidDevice = /android/.test(userAgent);
      setIsAndroid(isAndroidDevice);

      // Mobile detection (combination of factors)
      const isMobileDevice = hasTouch && (window.innerWidth < 768 || isIOSDevice || isAndroidDevice);
      setIsMobile(isMobileDevice);

      // Screen size detection
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('small');
      } else if (width < 1024) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    // Initial detection
    detectDevice();

    // Re-detect on resize
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('small');
      } else if (width < 1024) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    window.addEventListener('resize', handleResize);

    // Re-detect on orientation change
    window.addEventListener('orientationchange', detectDevice);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return {
    isTouchDevice,
    isPWA,
    isIOS,
    isAndroid,
    isMobile,
    screenSize,
    // Utility flags for common use cases
    isMobilePWA: isMobile && isPWA,
    isIOSPWA: isIOS && isPWA,
    isAndroidPWA: isAndroid && isPWA,
  };
}

/**
 * Constants for mobile development
 * Single source of truth for touch-related values
 */
export const MOBILE_CONSTANTS = {
  MIN_TOUCH_TARGET: 44, // Apple HIG minimum
  TOUCH_SLOP: 10, // Tolerance for touch movement
  DOUBLE_TAP_DELAY: 300, // ms to wait for double tap
  LONG_PRESS_DELAY: 500, // ms to trigger long press
  SWIPE_THRESHOLD: 50, // px to trigger swipe
} as const;