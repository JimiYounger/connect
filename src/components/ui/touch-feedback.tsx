'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TouchFeedbackProps {
  children: React.ReactNode;
  className?: string;
  /** Enable ripple effect on touch */
  ripple?: boolean;
  /** Enable scale effect on touch */
  scale?: boolean;
  /** Enable opacity change on touch */
  opacity?: boolean;
  /** Custom ripple color */
  rippleColor?: string;
  /** Ripple duration in ms */
  rippleDuration?: number;
  /** Disable all effects */
  disabled?: boolean;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * Touch Feedback Component
 * Single responsibility: Visual feedback for touch interactions
 * Provides ripple, scale, and opacity effects
 */
export function TouchFeedback({
  children,
  className,
  ripple = true,
  scale = false,
  opacity = true,
  rippleColor = 'rgba(0, 0, 0, 0.1)',
  rippleDuration = 600,
  disabled = false,
}: TouchFeedbackProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleCounter = useRef(0);

  // Handle touch/mouse start
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    setIsPressed(true);

    if (ripple && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const newRipple: Ripple = {
        x,
        y,
        size,
        id: rippleCounter.current++,
      };

      setRipples(prev => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, rippleDuration);
    }
  };

  // Handle touch/mouse end
  const handleEnd = () => {
    setIsPressed(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setRipples([]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden touch-manipulation',
        '[-webkit-tap-highlight-color:transparent]',
        'transition-all duration-200',
        isPressed && scale && 'scale-95',
        isPressed && opacity && 'opacity-70',
        className
      )}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      {children}

      {/* Ripple effects */}
      {ripple && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute animate-ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            borderRadius: '50%',
            transform: 'scale(0)',
            animation: `ripple ${rippleDuration}ms ease-out`,
          }}
        />
      ))}

      {/* Add ripple animation styles */}
      <style jsx>{`
        @keyframes ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook for adding haptic feedback
 * Single responsibility: Trigger device vibration
 * Note: Only works on devices that support vibration API
 */
export function useHapticFeedback() {
  const canVibrate = useRef(false);

  useEffect(() => {
    // Check if vibration API is supported
    canVibrate.current = 'vibrate' in navigator;
  }, []);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (canVibrate.current && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.debug('Haptic feedback not available:', error);
      }
    }
  };

  return {
    light: () => triggerHaptic(10),
    medium: () => triggerHaptic(20),
    heavy: () => triggerHaptic(30),
    success: () => triggerHaptic([10, 50, 10]),
    warning: () => triggerHaptic([20, 100, 20]),
    error: () => triggerHaptic([30, 100, 30, 100, 30]),
    custom: (pattern: number | number[]) => triggerHaptic(pattern),
    isSupported: canVibrate.current,
  };
}

/**
 * Wrapper component for buttons with touch feedback
 * Single responsibility: Add touch feedback to button elements
 */
export function TouchButton({
  children,
  onClick,
  className,
  disabled = false,
  haptic = 'light',
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | false;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const hapticFeedback = useHapticFeedback();

  const handleClick = () => {
    if (!disabled) {
      // Trigger haptic feedback
      if (haptic) {
        hapticFeedback[haptic]();
      }
      // Call onClick handler
      onClick?.();
    }
  };

  return (
    <TouchFeedback
      ripple
      scale
      opacity
      disabled={disabled}
      className={className}
    >
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'w-full h-full',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        {...props}
      >
        {children}
      </button>
    </TouchFeedback>
  );
}