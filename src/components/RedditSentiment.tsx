'use client';

import { useState, useEffect } from 'react';

interface RedditSentimentData {
  no_of_comments: number;
  sentiment: string;
  sentiment_score: number;
  ticker: string;
  sentiment_category: string;
  comment_volume: string;
  last_updated: string;
}

interface RedditSentimentResponse {
  data: RedditSentimentData[];
  total_count: number;
  source: string;
  last_updated: string;
  update_frequency: string;
  date_requested: string;
  is_mock?: boolean;
  api_status?: {
    status?: string;
    endpoint?: string;
    status_code?: number;
    status_text?: string;
    error?: string;
    error_details?: string;
    retry_suggestion?: string;
    last_checked?: string;
    response_time?: string;
  };
}

export default function RedditSentiment() {
  const [sentimentData, setSentimentData] = useState<RedditSentimentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'comments' | 'sentiment' | 'ticker'>('comments');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [isMockData, setIsMockData] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<RedditSentimentResponse['api_status'] | null>(null);

  useEffect(() => {
    fetchSentimentData();
  }, []);

  const fetchSentimentData = async (date?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/reddit-sentiment';
      if (date) {
        url += `?date=${date}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Reddit sentiment data');
      }
      
      const result: RedditSentimentResponse = await response.json();
      setSentimentData(result.data);
      setLastUpdated(result.last_updated);
      setIsMockData(result.is_mock || false);
      setApiStatus(result.api_status || null);
      
    } catch (err) {
      console.error('Reddit sentiment fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Reddit sentiment data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      fetchSentimentData(date);
    } else {
      fetchSentimentData(); // Fetch latest data
    }
  };

  const getSentimentColor = (sentiment: string, score: number) => {
    if (sentiment.includes('Bullish') || score > 0.1) {
      return 'text-green-600 dark:text-green-400';
    } else if (sentiment.includes('Bearish') || score < -0.1) {
      return 'text-red-600 dark:text-red-400';
    } else {
      return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getSentimentIcon = (sentiment: string, score: number) => {
    if (sentiment.includes('Very Bullish') || score > 0.15) return '🚀';
    if (sentiment.includes('Bullish') || score > 0.05) return '📈';
    if (sentiment.includes('Neutral') || Math.abs(score) <= 0.05) return '➖';
    if (sentiment.includes('Bearish') || score < -0.05) return '📉';
    if (sentiment.includes('Very Bearish') || score < -0.15) return '💥';
    return '❓';
  };


  const getFilteredAndSortedData = () => {
    let filtered = sentimentData;
    
    // Filter by sentiment
    if (filterSentiment !== 'all') {
      filtered = filtered.filter(item => {
        const sentiment = item.sentiment.toLowerCase();
        return sentiment.includes(filterSentiment.toLowerCase());
      });
    }
    
    // Sort data
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'comments':
          return b.no_of_comments - a.no_of_comments;
        case 'sentiment':
          return b.sentiment_score - a.sentiment_score;
        case 'ticker':
          return a.ticker.localeCompare(b.ticker);
        default:
          return b.no_of_comments - a.no_of_comments;
      }
    });
    
    return sorted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              WALLSTREETBETS_SENTIMENT_TRACKER
            </h2>
            {isMockData && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-mono rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 animate-pulse">
                  API UNAVAILABLE - SHOWING DEMO DATA
                </span>
                {apiStatus?.retry_suggestion && (
                  <div className="relative group">
                    <span className="px-3 py-1 text-xs font-mono rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-help">
                      ℹ️ INFO
                    </span>
                    <div className="absolute top-8 left-0 bg-black dark:bg-white text-white dark:text-black p-3 rounded-lg text-xs font-mono w-80 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-bold mb-2">API STATUS DETAILS:</div>
                      {apiStatus.status_code && (
                        <div>Status: {apiStatus.status_code} {apiStatus.status_text}</div>
                      )}
                      {apiStatus.error && (
                        <div>Error: {apiStatus.error}</div>
                      )}
                      {apiStatus.retry_suggestion && (
                        <div className="mt-2">Info: {apiStatus.retry_suggestion}</div>
                      )}
                      {apiStatus.last_checked && (
                        <div className="mt-2 text-gray-400">Checked: {new Date(apiStatus.last_checked).toLocaleTimeString()}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchSentimentData(selectedDate || undefined)}
              disabled={loading}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                loading
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-orange-500 text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              <span className={loading ? 'animate-spin' : ''}>\u27f3</span>
              {loading ? 'LOADING...' : 'REFRESH'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-1">
              DATE (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-1">
              SORT BY
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'comments' | 'sentiment' | 'ticker')}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="comments">COMMENTS</option>
              <option value="sentiment">SENTIMENT</option>
              <option value="ticker">TICKER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-1">
              FILTER SENTIMENT
            </label>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="all">ALL</option>
              <option value="bullish">BULLISH</option>
              <option value="bearish">BEARISH</option>
              <option value="neutral">NEUTRAL</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        {sentimentData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL STOCKS</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
                {getFilteredAndSortedData().length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">BULLISH</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                {sentimentData.filter(s => s.sentiment_score > 0.05).length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">BEARISH</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                {sentimentData.filter(s => s.sentiment_score < -0.05).length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">
                {isMockData ? 'DEMO DATA' : 'LAST UPDATE'}
              </div>
              <div className={`text-sm font-bold font-mono ${
                isMockData ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-white'
              }`}>
                {lastUpdated ? formatDate(lastUpdated) : 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
          <div className="text-red-600 dark:text-red-400 font-mono text-sm">
            ERROR: {error}
          </div>
        </div>
      )}

      {/* Sentiment Data Table */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
            REDDIT_SENTIMENT_DATA [{getFilteredAndSortedData().length}]
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg">
              LOADING_WALLSTREETBETS_DATA...
            </div>
          </div>
        ) : getFilteredAndSortedData().length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
              [ NO_SENTIMENT_DATA_FOUND ]
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
              {error ? 'Check API connection or try a different date' : 'Try adjusting filters or refresh data'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">RANK</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">TICKER</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">SENTIMENT</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">SCORE</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">COMMENTS</th>
                  <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {getFilteredAndSortedData().map((item, index) => (
                  <tr key={`${item.ticker}-${index}`} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-mono text-sm text-slate-600 dark:text-gray-400">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                        {item.ticker}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getSentimentIcon(item.sentiment, item.sentiment_score)}
                        </span>
                        <span className={`font-mono text-sm font-bold ${getSentimentColor(item.sentiment, item.sentiment_score)}`}>
                          {item.sentiment_category || item.sentiment}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-sm ${getSentimentColor(item.sentiment, item.sentiment_score)}`}>
                        {item.sentiment_score > 0 ? '+' : ''}{item.sentiment_score.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                      {item.no_of_comments.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-mono rounded-full ${
                        item.comment_volume === 'Very High' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' :
                        item.comment_volume === 'High' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        item.comment_volume === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.comment_volume}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}