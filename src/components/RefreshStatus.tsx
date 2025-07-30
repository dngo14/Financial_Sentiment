'use client';

import { useState, useEffect } from 'react';

interface SourceStatus {
  lastRefresh: Record<string, number>;
  refreshIntervals: Record<string, number>;
  errors: Record<string, string[]>;
  totalFetches: number;
}

interface RefreshStatusProps {
  sourceStatus?: SourceStatus | null;
  isLive: boolean;
}

const SOURCE_NAMES = {
  rss: 'RSS Feeds',
  finnhub: 'Finnhub API',
  newsapi: 'NewsAPI',
  marketaux: 'MarketAux',
  social: 'Social Media'
};

export default function RefreshStatus({ sourceStatus, isLive }: RefreshStatusProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!sourceStatus || !isLive) {
    return null;
  }

  const formatTimeRemaining = (lastRefresh: number, intervalMinutes: number): string => {
    const nextRefresh = lastRefresh + (intervalMinutes * 60 * 1000);
    const timeRemaining = Math.max(0, nextRefresh - currentTime);
    
    if (timeRemaining === 0) {
      return 'Eligible for refresh';
    }
    
    const minutes = Math.floor(timeRemaining / (60 * 1000));
    const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (lastRefresh: number, intervalMinutes: number): string => {
    const nextRefresh = lastRefresh + (intervalMinutes * 60 * 1000);
    const timeRemaining = nextRefresh - currentTime;
    
    if (timeRemaining <= 0) {
      return 'bg-amber-500 dark:bg-amber-400'; // Ready to refresh
    }
    if (timeRemaining < 30000) { // Less than 30 seconds
      return 'bg-orange-500 dark:bg-orange-400'; 
    }
    return 'bg-emerald-500 dark:bg-emerald-400'; // Fresh
  };

  const formatLastRefresh = (timestamp: number): string => {
    if (timestamp === 0) return 'Never';
    const ago = Math.floor((currentTime - timestamp) / 1000);
    
    if (ago < 60) return `${ago}s ago`;
    if (ago < 3600) return `${Math.floor(ago / 60)}m ago`;
    return `${Math.floor(ago / 3600)}h ago`;
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Data Source Status
        </button>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Total Fetches: {sourceStatus.totalFetches || 0}
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(sourceStatus.lastRefresh).map(([sourceType, lastRefresh]) => {
              const intervalMinutes = sourceStatus.refreshIntervals[sourceType] || 60;
              const hasErrors = sourceStatus.errors[sourceType]?.length > 0;
              
              return (
                <div key={sourceType} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          hasErrors ? 'bg-red-500 dark:bg-red-400' : getStatusColor(lastRefresh, intervalMinutes)
                        }`}
                      />
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {SOURCE_NAMES[sourceType as keyof typeof SOURCE_NAMES] || sourceType}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {formatTimeRemaining(lastRefresh, intervalMinutes) === 'Eligible for refresh' ? (
                        <span className="text-amber-600 dark:text-amber-400">Eligible for refresh</span>
                      ) : (
                        `Next: ${formatTimeRemaining(lastRefresh, intervalMinutes)}`
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last: {formatLastRefresh(lastRefresh)}
                    </div>
                    {hasErrors && (
                      <div className="text-xs text-red-600 dark:text-red-400" title={sourceStatus.errors[sourceType]?.join(', ')}>
                        ⚠ Error
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div>🟢 Fresh • 🟠 Refreshing Soon • 🟡 Eligible • 🔴 Error</div>
              <div>Auto-refresh checks every 3 minutes</div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 italic">
              Individual sources refresh when eligible during auto-refresh cycles or manual refresh
            </div>
          </div>
        </>
      )}
    </div>
  );
}