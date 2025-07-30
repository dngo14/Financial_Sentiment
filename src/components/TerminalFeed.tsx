'use client';

import { useState, useEffect, useRef } from 'react';
import { NewsItem } from '../lib/types';

interface TerminalFeedProps {
  items: NewsItem[];
  className?: string;
}

export default function TerminalFeed({ items, className = "" }: TerminalFeedProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (scrollRef.current && autoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items, autoScroll]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getSentimentData = (score?: number) => {
    if (!score) return { 
      symbol: '—', 
      color: 'text-slate-500', 
      bg: 'bg-slate-100',
      text: 'Neutral',
      value: '5.0'
    };
    if (score > 7) return { 
      symbol: '▲', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100',
      text: 'Bullish',
      value: score.toFixed(1)
    };
    if (score <= 3) return { 
      symbol: '▼', 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      text: 'Bearish',
      value: score.toFixed(1)
    };
    return { 
      symbol: '●', 
      color: 'text-amber-600', 
      bg: 'bg-amber-100',
      text: 'Neutral',
      value: score.toFixed(1)
    };
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoScroll(isAtBottom);
    }
  };

  const getSourceColor = (source: string) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-purple-600 dark:text-purple-400', 
      'text-emerald-600 dark:text-green-400',
      'text-cyan-600 dark:text-cyan-400',
      'text-pink-600 dark:text-pink-400',
      'text-indigo-600 dark:text-yellow-400'
    ];
    const hash = source.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`bg-gradient-to-b from-slate-100 to-slate-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-slate-300 dark:border-gray-700 shadow-xl ${className} rounded-lg overflow-hidden`}>
      {/* Terminal Header */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-700 border-b border-slate-300 dark:border-gray-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <span className="text-slate-800 dark:text-white font-mono text-sm font-bold">SOCIAL_SENTIMENT_FEED</span>
              <span className="text-red-500 dark:text-red-400 text-xs font-mono animate-pulse">● OFFLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-600 dark:text-gray-300">{currentTime.toLocaleDateString()}</span>
            <span className="text-slate-700 dark:text-blue-400">{currentTime.toLocaleTimeString()}</span>
            <span className="text-slate-600 dark:text-purple-400">{items.length} feeds</span>
          </div>
        </div>
      </div>

      {/* Command Line */}
      <div className="bg-slate-200 dark:bg-gray-800 border-b border-slate-300 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center text-sm font-mono">
          <span className="text-green-600 dark:text-green-400">user@market-terminal:~$</span>
          <span className="text-slate-800 dark:text-white ml-2">tail -f /feeds/social_sentiment.log</span>
          <span className="ml-1 text-green-600 dark:text-green-400 animate-pulse">_</span>
        </div>
      </div>

      {/* Feed Content */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-96 overflow-y-auto bg-slate-100 dark:bg-black scrollbar-thin scrollbar-track-slate-200 dark:scrollbar-track-gray-800 scrollbar-thumb-slate-400 dark:scrollbar-thumb-blue-500/50"
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-slate-600 dark:text-gray-400 text-lg mb-2 font-mono">[ INITIALIZING FEED ]</div>
              <div className="text-slate-500 dark:text-gray-500 text-sm font-mono">Social channels offline...</div>
              <div className="text-red-500 dark:text-red-400 text-sm mt-2 animate-pulse font-mono">● Service unavailable</div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item, index) => {
              const sentiment = getSentimentData(item.sentimentScore);
              const sourceColor = getSourceColor(item.source);
              
              return (
                <div 
                  key={item.id} 
                  className={`group hover:bg-slate-200/30 dark:hover:bg-gray-800/30 transition-all duration-200 border-b border-slate-300/50 dark:border-gray-800/50 ${
                    index % 2 === 0 ? 'bg-slate-50/20 dark:bg-gray-900/20' : 'bg-slate-100/20 dark:bg-black/20'
                  }`}
                >
                  {/* Main content row */}
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Timestamp */}
                    <div className="flex flex-col items-center min-w-[80px]">
                      <span className="text-green-600 dark:text-green-400 text-xs font-mono leading-none">
                        {formatTime(item.timestamp)}
                      </span>
                      <span className="text-slate-500 dark:text-gray-500 text-xs font-mono">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>

                    {/* Sentiment indicator */}
                    <div className="flex flex-col items-center min-w-[60px]">
                      <div className={`${sentiment.bg} px-2 py-1 rounded text-center min-w-[40px]`}>
                        <div className={`${sentiment.color} text-lg font-bold`}>
                          {sentiment.symbol}
                        </div>
                        <div className={`${sentiment.color} text-xs font-mono`}>
                          {sentiment.text}
                        </div>
                      </div>
                      <span className="text-slate-500 dark:text-gray-400 text-xs font-mono mt-1">
                        {sentiment.value}
                      </span>
                    </div>

                    {/* Source */}
                    <div className="min-w-[100px]">
                      <span className={`${sourceColor} text-sm font-mono font-bold`}>
                        {item.source.replace('@', '').toUpperCase()}
                      </span>
                      <div className="text-slate-500 dark:text-gray-500 text-xs font-mono">
                        {item.apiSource?.toUpperCase() || 'API'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-800 dark:text-white text-sm leading-relaxed mb-1 group-hover:text-slate-900 dark:group-hover:text-gray-100 transition-colors">
                        {item.headline}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-blue-600 dark:text-blue-400 font-mono">
                          {item.category?.toUpperCase() || 'GENERAL'}
                        </span>
                        {item.sentimentScore && (
                          <span className="text-slate-600 dark:text-gray-400 font-mono">
                            SCORE: {item.sentimentScore.toFixed(1)}/10
                          </span>
                        )}
                        <span className="text-slate-500 dark:text-gray-500 font-mono">
                          ID: {item.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="min-w-[20px] flex justify-center">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              );
            })
            }
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="bg-gradient-to-r from-slate-200 to-slate-100 dark:from-gray-800 dark:to-gray-700 border-t border-slate-300 dark:border-gray-600 px-4 py-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-red-500 dark:text-red-400">● OFFLINE</span>
            <span className="text-slate-600 dark:text-blue-400">AUTO-SCROLL: {autoScroll ? 'ENABLED' : 'DISABLED'}</span>
            <span className="text-slate-600 dark:text-purple-400">FEEDS: {items.length}</span>
            {!autoScroll && (
              <button 
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    setAutoScroll(true);
                  }
                }}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 px-2 py-1 border border-yellow-400/30 rounded transition-colors"
              >
                SCROLL_TO_END
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-gray-400">v3.2.1</span>
            <span className="text-slate-400 dark:text-gray-500">|</span>
            <span className="text-slate-500 dark:text-gray-400">MARKET_TERMINAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}