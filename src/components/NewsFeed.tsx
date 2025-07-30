'use client';

import { useState, useEffect } from 'react';
import { NewsItem, PaginatedSeparatedFeeds, PaginatedFeed } from '../lib/types';
import SentimentCard from './SentimentCard';
import ThemeToggle from './ThemeToggle';
import TerminalFeed from './TerminalFeed';
import CompanySearch from './CompanySearch';

export default function NewsFeed() {
  const [newsFeed, setNewsFeed] = useState<PaginatedFeed>({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [socialFeed, setSocialFeed] = useState<PaginatedFeed>({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshErrors, setRefreshErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'sentiment'>('time');
  const [category, setCategory] = useState<'all' | 'markets' | 'crypto' | 'politics' | 'tech' | 'personal-finance' | 'earnings' | 'general'>('all');
  const [newsPage, setNewsPage] = useState(1);
  const [socialPage] = useState(1);
  const [pageSize] = useState(10);
  const [showCompanySearch, setShowCompanySearch] = useState(false);

  useEffect(() => {
    loadHeadlines();
    setLastRefresh(new Date());
  }, []);

  const loadHeadlines = async (forceRefresh = false) => {
    if (refreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    if (forceRefresh) {
      setRefreshing(true);
      setRefreshErrors([]);
    }
    
    try {
      const params = new URLSearchParams();
      params.set('separate', 'true');
      params.set('paginated', 'true');
      params.set('newsPage', newsPage.toString());
      params.set('socialPage', socialPage.toString());
      params.set('pageSize', pageSize.toString());
      if (category !== 'all') {
        params.set('category', category);
      }
      if (forceRefresh) {
        params.set('force', 'true');
        params.set('t', Date.now().toString());
      }
      
      const response = await fetch(`/api/headlines?${params.toString()}`, {
        signal: AbortSignal.timeout(30000)
      });
      
      if (response.ok) {
        const data: PaginatedSeparatedFeeds = await response.json();
        
        if (data.news && data.social) {
          setNewsFeed(data.news);
          setSocialFeed(data.social);

          if (forceRefresh) {
            setLastRefresh(new Date());
          }
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading headlines:', error);
      
      if (forceRefresh) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setRefreshErrors(prev => [...prev.slice(-2), `Refresh failed: ${errorMessage}`]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      await loadHeadlines(true);
    } catch (error) {
      console.error('Manual refresh failed:', error);
    }
  };

  useEffect(() => {
    loadHeadlines(false);
  }, [newsPage, socialPage, category]);
  
  useEffect(() => {
    if (refreshErrors.length > 0) {
      const timer = setTimeout(() => {
        setRefreshErrors([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [refreshErrors]);

  const filterItems = (items: NewsItem[] | undefined) => {
    if (!items) return [];
    return items.filter(item => {
      if (filter === 'all') return true;
      if (!item.sentimentScore) return filter === 'neutral';
      
      if (filter === 'bullish') return item.sentimentScore > 7;
      if (filter === 'bearish') return item.sentimentScore <= 3;
      if (filter === 'neutral') return item.sentimentScore > 3 && item.sentimentScore <= 7;
      
      return true;
    });
  };

  const sortItems = (items: NewsItem[]) => {
    if (!items || items.length === 0) return [];
    return [...items].sort((a, b) => {
      if (sortBy === 'time') {
        return b.timestamp - a.timestamp;
      } else {
        return (b.sentimentScore || 5) - (a.sentimentScore || 5);
      }
    });
  };

  const filteredNews = sortItems(filterItems(newsFeed?.items));
  const filteredSocial = sortItems(filterItems(socialFeed?.items));

  const getSentimentStats = () => {
    const newsItems = newsFeed?.items || [];
    const socialItems = socialFeed?.items || [];
    const allItems = [...newsItems, ...socialItems];
    const analyzed = allItems.filter(h => h.sentimentScore);
    const bullish = analyzed.filter(h => h.sentimentScore! > 7).length;
    const bearish = analyzed.filter(h => h.sentimentScore! <= 3).length;
    const neutral = analyzed.filter(h => h.sentimentScore! > 3 && h.sentimentScore! <= 7).length;
    
    return { total: analyzed.length, bullish, bearish, neutral };
  };

  const stats = getSentimentStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-green-500/30 border-t-green-400 rounded-full animate-spin mx-auto mb-6"></div>
          </div>
          <p className="text-green-400 text-lg font-mono mb-2">INITIALIZING TERMINAL...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-mono">Loading market sentiment data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-800 dark:text-gray-100 font-mono">
      {/* Terminal Header */}
      <div className="bg-white/70 dark:bg-gray-900 backdrop-blur-sm border-b border-slate-200 dark:border-green-500/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Terminal Header Row */}
          <div className="flex items-center justify-between py-3">
            {/* Terminal Title */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-4">
                <div className="text-slate-800 dark:text-green-400 font-bold text-lg tracking-wider">
                  MARKET_SENTIMENT_TERMINAL
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-mono">ONLINE</span>
                </div>
              </div>
            </div>
            
            {/* Terminal Controls */}
            <div className="flex items-center gap-6">
              {/* System Time */}
              <div className="text-green-400 text-sm font-mono">
                {new Date().toLocaleString('en-US', {
                  timeZone: 'America/New_York',
                  hour12: false,
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              
              {/* Company Search Button */}
              <button
                onClick={() => setShowCompanySearch(true)}
                className="flex items-center gap-2 px-3 py-1 border border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 font-mono text-sm transition-all"
              >
                <span>🔍</span>
                SEARCH
              </button>
              
              {/* Manual Refresh Button */}
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-3 py-1 border font-mono text-sm transition-all ${
                  refreshing
                    ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                    : 'border-green-500 text-green-400 hover:bg-green-500/10 hover:text-green-300'
                }`}
              >
                <span className={refreshing ? 'animate-spin' : ''}>⟳</span>
                {refreshing ? 'REFRESHING...' : 'REFRESH'}
              </button>
              
              {lastRefresh && (
                <div className="text-gray-400 text-xs font-mono">
                  LAST: {lastRefresh.toLocaleTimeString()}
                </div>
              )}
              
              <a
                href="/finance"
                className="px-3 py-1 font-mono text-xs border border-blue-400 text-blue-400 hover:bg-blue-400/10 transition-all rounded"
              >
                FINANCIAL_HUB →
              </a>
              
              <ThemeToggle />
            </div>
          </div>
          
          {/* Terminal Stats Bar */}
          <div className="border-t border-slate-200 dark:border-green-500/20 bg-slate-100/50 dark:bg-gray-800/50 px-4 py-3">
            <div className="grid grid-cols-4 gap-8">
              <div className="text-center hover:bg-white/20 dark:hover:bg-gray-700/30 p-2 rounded transition-all duration-300">
                <div className="text-2xl font-bold text-slate-800 dark:text-cyan-400 font-mono animate-fadeInUp">{stats.total}</div>
                <div className="text-xs text-slate-600 dark:text-gray-400 uppercase tracking-wider font-mono">TOTAL_ANALYZED</div>
              </div>
              <div className="text-center hover:bg-white/20 dark:hover:bg-gray-700/30 p-2 rounded transition-all duration-300">
                <div className="text-2xl font-bold text-emerald-600 dark:text-green-400 font-mono animate-fadeInUp">{stats.bullish}</div>
                <div className="text-xs text-emerald-700 dark:text-green-500 uppercase tracking-wider font-mono">BULLISH_SIGNALS</div>
              </div>
              <div className="text-center hover:bg-white/20 dark:hover:bg-gray-700/30 p-2 rounded transition-all duration-300">
                <div className="text-2xl font-bold text-red-500 dark:text-red-400 font-mono animate-fadeInUp">{stats.bearish}</div>
                <div className="text-xs text-red-600 dark:text-red-500 uppercase tracking-wider font-mono">BEARISH_SIGNALS</div>
              </div>
              <div className="text-center hover:bg-white/20 dark:hover:bg-gray-700/30 p-2 rounded transition-all duration-300">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono animate-fadeInUp">{stats.neutral}</div>
                <div className="text-xs text-amber-700 dark:text-amber-500 uppercase tracking-wider font-mono">NEUTRAL_SIGNALS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Error Display */}
      {refreshErrors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded p-3 font-mono">
            <div className="flex items-start gap-3">
              <span className="text-red-500 dark:text-red-400 font-bold">⚠</span>
              <div className="flex-1">
                <div className="text-red-800 dark:text-red-400 font-bold text-sm mb-2">
                  SYSTEM_ERROR_DETECTED
                </div>
                <div className="space-y-1">
                  {refreshErrors.map((error, index) => (
                    <div key={index} className="text-red-700 dark:text-red-300 text-xs">
                      [{(index + 1).toString().padStart(2, '0')}] {error}
                    </div>
                  ))}
                </div>
                <div className="text-red-600 dark:text-gray-400 text-xs mt-2">
                  SOURCE_UNAVAILABLE: DISPLAYING_CACHED_DATA
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Control Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white/60 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-green-500/30 rounded p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Terminal Filter Controls */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  filter === 'all'
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-600 dark:text-cyan-400'
                    : 'border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                ALL[{(newsFeed?.total || 0) + (socialFeed?.total || 0)}]
              </button>
              <button
                onClick={() => setFilter('bullish')}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  filter === 'bullish'
                    ? 'border-green-400 bg-green-400/10 text-green-600 dark:text-green-400'
                    : 'border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                BUL[{stats.bullish}]
              </button>
              <button
                onClick={() => setFilter('neutral')}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  filter === 'neutral'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-400'
                    : 'border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                NEU[{stats.neutral}]
              </button>
              <button
                onClick={() => setFilter('bearish')}
                className={`px-3 py-1 text-xs font-mono border transition-all ${
                  filter === 'bearish'
                    ? 'border-red-400 bg-red-400/10 text-red-600 dark:text-red-400'
                    : 'border-slate-300 dark:border-gray-600 text-slate-600 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                }`}
              >
                BER[{stats.bearish}]
              </button>
            </div>

            {/* Sort and Category Controls */}
            <div className="flex items-center gap-6">
              {/* Sort Controls */}
              <div className="flex items-center gap-3">
                <span className="text-green-400 font-mono text-xs">SORT:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'sentiment')}
                  className="bg-white dark:bg-black border border-slate-300 dark:border-green-500/30 text-slate-700 dark:text-green-400 px-3 py-1 text-xs font-mono focus:outline-none focus:border-green-400 hover:border-green-400/60"
                >
                  <option value="time">TIME_DESC</option>
                  <option value="sentiment">SENTIMENT</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <span className="text-green-400 font-mono text-xs">CATEGORY:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="bg-white dark:bg-black border border-slate-300 dark:border-green-500/30 text-slate-700 dark:text-green-400 px-3 py-1 text-xs font-mono focus:outline-none focus:border-green-400 hover:border-green-400/60"
                >
                  <option value="all">ALL</option>
                  <option value="markets">MARKETS</option>
                  <option value="tech">TECH</option>
                  <option value="crypto">CRYPTO</option>
                  <option value="politics">POLITICS</option>
                  <option value="earnings">EARNINGS</option>
                  <option value="personal-finance">FINANCE</option>
                  <option value="general">GENERAL</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* News Articles Terminal */}
          <div className="bg-white/70 dark:bg-gray-900 backdrop-blur-sm border border-slate-200 dark:border-cyan-500/30 overflow-hidden rounded animate-slideInLeft">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-cyan-500/20 bg-white/50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <h2 className="text-slate-800 dark:text-cyan-400 font-mono text-sm font-bold">NEWS_FEED</h2>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 text-xs font-mono border border-cyan-200 dark:border-cyan-500/30 transition-all duration-200">
                  {newsFeed?.total || 0}
                </span>
              </div>
            </div>
            
            <div className="h-[600px] overflow-y-auto bg-slate-50/50 dark:bg-black">
              {filteredNews.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-slate-600 dark:text-cyan-400 text-lg mb-2 font-mono">[ NO_DATA_STREAM ]</div>
                    <div className="text-slate-500 dark:text-gray-500 text-sm font-mono">Adjust filters or refresh</div>
                    <div className="text-cyan-500 dark:text-cyan-400/40 text-sm mt-2 animate-pulse font-mono">● MONITORING</div>
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredNews.map((item) => (
                    <SentimentCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
            
            {/* News Pagination */}
            {newsFeed && newsFeed.totalPages > 1 && (
              <div className="border-t border-slate-200 dark:border-cyan-500/20 bg-white/50 dark:bg-gray-800 px-3 py-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-600 dark:text-gray-400">
                    SHOWING {newsFeed.items?.length || 0}/{newsFeed.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNewsPage(newsFeed.page - 1)}
                      disabled={!newsFeed?.hasPrevPage}
                      className={`px-2 py-1 border text-xs font-mono transition-colors ${
                        newsFeed?.hasPrevPage
                          ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10'
                          : 'border-slate-300 dark:border-gray-700 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      PREV
                    </button>
                    <span className="text-cyan-600 dark:text-cyan-400 px-2">
                      {newsFeed.page}/{newsFeed.totalPages}
                    </span>
                    <button
                      onClick={() => setNewsPage(newsFeed.page + 1)}
                      disabled={!newsFeed?.hasNextPage}
                      className={`px-2 py-1 border text-xs font-mono transition-colors ${
                        newsFeed?.hasNextPage
                          ? 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10'
                          : 'border-slate-300 dark:border-gray-700 text-slate-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Social Terminal Feed */}
          <div className="bg-transparent animate-slideInRight">
            <div className="mb-4 flex items-center gap-3 px-3 py-2 bg-white/70 dark:bg-gray-900 border border-slate-200 dark:border-red-500/30">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <h2 className="text-slate-800 dark:text-red-400 font-mono text-sm font-bold">SOCIAL_STREAM</h2>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-mono border border-red-200 dark:border-red-500/30">
                OFFLINE
              </span>
            </div>
            
            <TerminalFeed 
              items={filteredSocial} 
              className="w-full"
            />
            
            {/* Terminal Stats */}
            <div className="mt-4 bg-white/60 dark:bg-gray-900/80 border border-slate-200 dark:border-red-500/20 p-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span className="text-red-600 dark:text-red-400">
                    SOCIAL_FEEDS: DISABLED
                  </span>
                  <span className="text-slate-500 dark:text-gray-500">
                    X/TWITTER_API_REMOVED
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 dark:text-gray-400 text-xs">
                    RSS_NEWS_ONLY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="mt-8 pb-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/60 dark:bg-gray-900/80 backdrop-blur-sm border border-slate-200 dark:border-green-500/30 px-4 py-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-600 dark:text-blue-400">MANUAL_MODE</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-green-500/30"></div>
              <span className="text-slate-700 dark:text-green-400">
                REFRESH_ONLY
              </span>
              <div className="w-px h-4 bg-slate-300 dark:bg-green-500/30"></div>
              <span className="text-slate-600 dark:text-gray-400">
                {lastRefresh ? `LAST_UPDATE: ${lastRefresh.toLocaleTimeString()}` : 'INITIALIZING...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Search Modal */}
      {showCompanySearch && (
        <CompanySearch onClose={() => setShowCompanySearch(false)} />
      )}
    </div>
  );
}