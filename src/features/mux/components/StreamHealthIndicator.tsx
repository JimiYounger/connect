'use client';

import { useEffect, useState } from 'react';
import { useRiversideAnalytics } from '../services/riverisideAnalytics';

interface StreamHealthIndicatorProps {
  isVisible?: boolean;
}

export default function StreamHealthIndicator({ isVisible = false }: StreamHealthIndicatorProps) {
  const [healthData, setHealthData] = useState<any>(null);
  const riversideAnalytics = useRiversideAnalytics();

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      const summary = riversideAnalytics.getStreamHealthSummary();
      setHealthData(summary);
    }, 2000);

    return () => clearInterval(interval);
  }, [riversideAnalytics, isVisible]);

  if (!isVisible || !healthData?.averageQuality) return null;

  const { averageQuality, issues } = healthData;
  const bufferHealth = averageQuality.bufferHealth;
  const hasIssues = issues.length > 0;

  const getHealthColor = () => {
    if (hasIssues) return 'text-red-500';
    if (bufferHealth > 0.7) return 'text-green-500';
    if (bufferHealth > 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthStatus = () => {
    if (hasIssues) return 'Issues Detected';
    if (bufferHealth > 0.7) return 'Excellent';
    if (bufferHealth > 0.4) return 'Good';
    return 'Poor';
  };

  return (
    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white p-3 rounded-lg text-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${getHealthColor()} ${hasIssues ? 'animate-pulse' : ''}`} />
        <span className="font-medium">Stream Health: {getHealthStatus()}</span>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span>Buffer:</span>
          <span>{Math.round(bufferHealth * 100)}%</span>
        </div>
        
        <div className="flex justify-between gap-4">
          <span>Resolution:</span>
          <span>{averageQuality.currentResolution || 'N/A'}</span>
        </div>
        
        {averageQuality.bandwidth > 0 && (
          <div className="flex justify-between gap-4">
            <span>Bandwidth:</span>
            <span>{Math.round(averageQuality.bandwidth)} Kbps</span>
          </div>
        )}
        
        {averageQuality.droppedFrames > 0 && (
          <div className="flex justify-between gap-4">
            <span>Dropped Frames:</span>
            <span className="text-yellow-400">{Math.round(averageQuality.droppedFrames)}</span>
          </div>
        )}
      </div>
      
      {issues.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-red-400 font-medium text-xs">Issues:</div>
          {issues.map((issue: string, index: number) => (
            <div key={index} className="text-red-300 text-xs">• {issue}</div>
          ))}
        </div>
      )}
    </div>
  );
}