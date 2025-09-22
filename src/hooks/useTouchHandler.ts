'use client';

import { useRef, useCallback, useEffect } from 'react';
import { MOBILE_CONSTANTS } from './useMobileDevice';

interface TouchHandlerOptions {
  onTap?: (e: TouchEvent | MouseEvent) => void;
  onDoubleTap?: (e: TouchEvent | MouseEvent) => void;
  onLongPress?: (e: TouchEvent | MouseEvent) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  disabled?: boolean;
  preventDefault?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTouching: boolean;
}

/**
 * Hook for handling touch interactions with gesture support
 * Single responsibility: Touch event management
 *
 * @param options Touch handler configuration
 * @returns Ref to attach to element
 */
export function useTouchHandler<T extends HTMLElement = HTMLElement>(
  options: TouchHandlerOptions
) {
  const elementRef = useRef<T>(null);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTouching: false,
  });
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);

  // Handle touch/mouse start
  const handleStart = useCallback((e: TouchEvent | MouseEvent) => {
    if (options.disabled) return;

    if (options.preventDefault) {
      e.preventDefault();
    }

    // Get coordinates
    const touch = 'touches' in e ? e.touches[0] : e;
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTouching: true,
    };

    // Clear any existing timers
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

    // Set up long press detection
    if (options.onLongPress) {
      longPressTimeout.current = setTimeout(() => {
        if (touchState.current.isTouching) {
          options.onLongPress!(e);
          touchState.current.isTouching = false; // Prevent tap after long press
        }
      }, MOBILE_CONSTANTS.LONG_PRESS_DELAY);
    }
  }, [options]);

  // Handle touch/mouse end
  const handleEnd = useCallback((e: TouchEvent | MouseEvent) => {
    if (options.disabled || !touchState.current.isTouching) return;

    if (options.preventDefault) {
      e.preventDefault();
    }

    // Clear long press timer
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }

    // Get end coordinates
    const touch = 'changedTouches' in e ? e.changedTouches[0] : e;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    // Calculate deltas
    const deltaX = endX - touchState.current.startX;
    const deltaY = endY - touchState.current.startY;
    const deltaTime = endTime - touchState.current.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Reset touch state
    touchState.current.isTouching = false;

    // Check for tap (minimal movement, short duration)
    if (distance < MOBILE_CONSTANTS.TOUCH_SLOP && deltaTime < MOBILE_CONSTANTS.LONG_PRESS_DELAY) {
      const timeSinceLastTap = endTime - lastTapTime.current;

      // Check for double tap
      if (options.onDoubleTap && timeSinceLastTap < MOBILE_CONSTANTS.DOUBLE_TAP_DELAY) {
        if (tapTimeout.current) clearTimeout(tapTimeout.current);
        options.onDoubleTap(e);
        lastTapTime.current = 0;
      } else {
        // Single tap (with delay to check for double tap)
        lastTapTime.current = endTime;
        if (options.onTap) {
          if (options.onDoubleTap) {
            tapTimeout.current = setTimeout(() => {
              if (lastTapTime.current > 0) {
                options.onTap!(e);
              }
            }, MOBILE_CONSTANTS.DOUBLE_TAP_DELAY);
          } else {
            options.onTap(e);
          }
        }
      }
    }
    // Check for swipe gestures
    else if (distance > MOBILE_CONSTANTS.SWIPE_THRESHOLD) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > absY) {
        if (deltaX > 0 && options.onSwipeRight) {
          options.onSwipeRight();
        } else if (deltaX < 0 && options.onSwipeLeft) {
          options.onSwipeLeft();
        }
      }
      // Vertical swipe
      else {
        if (deltaY > 0 && options.onSwipeDown) {
          options.onSwipeDown();
        } else if (deltaY < 0 && options.onSwipeUp) {
          options.onSwipeUp();
        }
      }
    }
  }, [options]);

  // Handle touch/mouse cancel
  const handleCancel = useCallback(() => {
    touchState.current.isTouching = false;
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  }, []);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleStart as any, { passive: !options.preventDefault });
    element.addEventListener('touchend', handleEnd as any, { passive: !options.preventDefault });
    element.addEventListener('touchcancel', handleCancel);

    // Mouse events (for desktop testing)
    element.addEventListener('mousedown', handleStart as any);
    element.addEventListener('mouseup', handleEnd as any);
    element.addEventListener('mouseleave', handleCancel);

    return () => {
      element.removeEventListener('touchstart', handleStart as any);
      element.removeEventListener('touchend', handleEnd as any);
      element.removeEventListener('touchcancel', handleCancel);
      element.removeEventListener('mousedown', handleStart as any);
      element.removeEventListener('mouseup', handleEnd as any);
      element.removeEventListener('mouseleave', handleCancel);

      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    };
  }, [handleStart, handleEnd, handleCancel, options.preventDefault]);

  return elementRef;
}

/**
 * Simple hook for preventing double tap zoom
 * Single responsibility: Prevent double tap zoom only
 */
export function usePreventDoubleTapZoom<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);
  const lastTouchEnd = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd.current <= MOBILE_CONSTANTS.DOUBLE_TAP_DELAY) {
        e.preventDefault();
      }
      lastTouchEnd.current = now;
    };

    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return elementRef;
}