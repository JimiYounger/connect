'use client';

import { cn } from '@/lib/utils';

interface AthleticLoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AthleticLoading({
  message = "Loading",
  className,
  size = 'md'
}: AthleticLoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-6",
      className
    )}>
      {/* Athletic Motion Loader */}
      <div className="relative">
        {/* Outer Ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-gray-200",
          sizeClasses[size]
        )} />

        {/* Dynamic Progress Ring */}
        <div className={cn(
          "rounded-full border-2 border-transparent border-t-black athletic-spin",
          sizeClasses[size]
        )} />

        {/* Inner Pulse */}
        <div className={cn(
          "absolute rounded-full bg-black opacity-80 athletic-pulse",
          size === 'lg' ? 'inset-3' : size === 'sm' ? 'inset-1' : 'inset-2'
        )} />
      </div>

      {/* Premium Typography */}
      <div className="text-center space-y-1">
        <div className={cn(
          "font-semibold tracking-wide text-black",
          textSizes[size]
        )}>
          {message}
        </div>

        {/* Dynamic Dots */}
        <div className="flex items-center justify-center gap-1">
          <div className="w-1 h-1 bg-black rounded-full athletic-dot-1" />
          <div className="w-1 h-1 bg-black rounded-full athletic-dot-2" />
          <div className="w-1 h-1 bg-black rounded-full athletic-dot-3" />
        </div>
      </div>
    </div>
  );
}

export function AthleticLoadingScreen({
  message = "Loading",
  fullScreen = true
}: {
  message?: string;
  fullScreen?: boolean;
}) {
  return (
    <div className={cn(
      "bg-white flex items-center justify-center",
      fullScreen ? "min-h-screen" : "h-full",
      "relative overflow-hidden"
    )}>
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />

      {/* Dynamic Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-black/5 rounded-full blur-xl athletic-bg-pulse-1" />
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-black/5 rounded-full blur-xl athletic-bg-pulse-2" />

      {/* Main Loading Content */}
      <div className="relative z-10 flex flex-col items-center">
        <AthleticLoading message={message} size="lg" />

        {/* Athletic Progress Bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-black rounded-full athletic-progress" />
        </div>
      </div>
    </div>
  );
}