import { NewsItem } from '../lib/types';

interface SentimentCardProps {
  item: NewsItem;
}

export default function SentimentCard({ item }: SentimentCardProps) {
  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-500/10 border-slate-200 dark:border-gray-600';
    if (score <= 3) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
    if (score <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30';
    return 'text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-green-500/10 border-emerald-200 dark:border-green-500/30';
  };

  const getSentimentIcon = (score?: number) => {
    if (!score) return '—';
    if (score <= 3) return '▼';
    if (score <= 7) return '●';
    return '▲';
  };

  const getSentimentLabel = (score?: number) => {
    if (!score) return 'NEU';
    if (score <= 3) return 'BER';
    if (score <= 7) return 'NEU';
    return 'BUL';
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-slate-50/80 dark:bg-gray-900/80 border border-slate-200 dark:border-cyan-500/20 hover:border-slate-300 dark:hover:border-cyan-500/30 transition-all duration-200 font-mono text-xs group">
      <div className="p-3">
        {/* Terminal Header Line */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-700 dark:text-cyan-400 font-bold">
              {formatTime(item.timestamp)}
            </span>
            <span className="text-slate-500 dark:text-gray-500">
              {formatDate(item.timestamp)}
            </span>
            <span className="text-blue-600 dark:text-blue-400 uppercase">
              {item.source.replace('@', '').substring(0, 12)}
            </span>
          </div>
          
          {/* Sentiment Display */}
          <div className={`px-2 py-1 ${getSentimentColor(item.sentimentScore)} border flex items-center gap-2`}>
            <span className="font-bold">{getSentimentIcon(item.sentimentScore)}</span>
            <span>{getSentimentLabel(item.sentimentScore)}</span>
            {item.sentimentScore && (
              <span className="text-xs">{item.sentimentScore.toFixed(1)}</span>
            )}
          </div>
        </div>

        {/* Headline */}
        <div className="mb-2">
          {item.url ? (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-800 dark:text-white hover:text-blue-600 dark:hover:text-cyan-300 transition-colors leading-tight block"
            >
              {item.headline}
              <span className="inline-block ml-1 text-blue-500 dark:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
            </a>
          ) : (
            <div className="text-slate-800 dark:text-white leading-tight">
              {item.headline}
            </div>
          )}
        </div>

        {/* Metadata Line */}
        <div className="flex items-center gap-4 text-xs">
          {item.category && (
            <span className="text-purple-600 dark:text-purple-400">
              CAT: {item.category.toUpperCase()}
            </span>
          )}
          {item.apiSource && (
            <span className="text-green-600 dark:text-green-400">
              SRC: {item.apiSource.toUpperCase()}
            </span>
          )}
          <span className="text-slate-500 dark:text-gray-500">
            ID: {item.id.substring(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Summary (if available) */}
        {item.summary && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-gray-700/50">
            <div className="text-amber-600 dark:text-amber-400 text-xs mb-1">
              {item.summary.startsWith('[FALLBACK ANALYSIS]') ? 'KEYWORD_ANALYSIS:' : 'AI_SUMMARY:'}
            </div>
            <div className="text-slate-700 dark:text-gray-300 text-xs leading-relaxed">
              {item.summary.replace('[FALLBACK ANALYSIS] ', '')}
            </div>
          </div>
        )}

        {/* Tickers */}
        {item.tickers && item.tickers.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-gray-700/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-blue-600 dark:text-blue-400 text-xs">TICKERS:</span>
              {item.tickers.map((ticker, index) => (
                <span
                  key={index}
                  className="text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-400/10 px-1 py-0.5 border border-yellow-300 dark:border-yellow-400/30 text-xs font-bold"
                >
                  ${ticker}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}