'use client';

import { useState, useEffect } from 'react';
import { apiRateLimiter } from '../lib/apiRateLimit';

interface APIStatusProps {
  className?: string;
  showLabel?: boolean;
}

export default function APIStatus({ className = '', showLabel = true }: APIStatusProps) {
  const [status, setStatus] = useState(apiRateLimiter.getDisplayStatus());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    updateStatus();
    
    // Update every second to show countdown
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    setStatus(apiRateLimiter.getDisplayStatus());
  };

  if (!mounted) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span className="text-xs font-mono text-gray-400">
          {showLabel && 'API: '}Loading...
        </span>
      </div>
    );
  }

  const getStatusDot = () => {
    if (status.remainingCalls === 0) {
      return <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>;
    } else if (status.remainingCalls <= 2) {
      return <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>;
    } else {
      return <span className="w-2 h-2 bg-green-500 rounded-full"></span>;
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusDot()}
      <span className={`text-xs font-mono ${status.color}`}>
        {showLabel ? 'Financial APIs: ' : ''}{status.text}
      </span>
    </div>
  );
}