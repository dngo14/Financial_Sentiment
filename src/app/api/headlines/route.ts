import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { NewsItem, PaginatedSeparatedFeeds, PaginatedFeed } from '../../../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const HEADLINES_FILE = path.join(DATA_DIR, 'headlines.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

// Source refresh intervals (in minutes)
const REFRESH_INTERVALS = {
  rss: 15,        // RSS feeds every 15 minutes
  finnhub: 30,    // Finnhub API every 30 minutes
  newsapi: 20,    // NewsAPI every 20 minutes
  marketaux: 25,  // MarketAux API every 25 minutes
  fallback: 60    // Fallback refresh every 60 minutes
};

// Data retention period (24 hours in milliseconds)
const DATA_RETENTION_PERIOD = 24 * 60 * 60 * 1000;

// Helper function to get source metadata
async function getSourceMetadata() {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      lastRefresh: {
        rss: 0,
        finnhub: 0,
        newsapi: 0,
        marketaux: 0
      },
      errors: {},
      totalFetches: 0
    };
  }
}

// Helper function to save source metadata
async function saveSourceMetadata(metadata: any) {
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Helper function to check if source needs refresh
function shouldRefreshSource(sourceType: string, lastRefresh: number): boolean {
  const interval = REFRESH_INTERVALS[sourceType as keyof typeof REFRESH_INTERVALS] || REFRESH_INTERVALS.fallback;
  const timeSinceRefresh = Date.now() - lastRefresh;
  return timeSinceRefresh >= (interval * 60 * 1000);
}


// Advanced duplicate detection
function isDuplicate(item: NewsItem, existingItems: NewsItem[]): boolean {
  return existingItems.some(existing => {
    // Check exact headline match
    if (existing.headline.trim().toLowerCase() === item.headline.trim().toLowerCase()) {
      return true;
    }
    
    // Check URL match (if both have URLs)
    if (existing.url && item.url && existing.url === item.url) {
      return true;
    }
    
    // Check similar headlines (90% similarity)
    const similarity = calculateSimilarity(existing.headline, item.headline);
    if (similarity > 0.9) {
      return true;
    }
    
    return false;
  });
}

// Calculate text similarity
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Helper function to categorize content based on headline
function categorizeContent(headline: string): 'markets' | 'crypto' | 'politics' | 'tech' | 'personal-finance' | 'earnings' | 'general' {
  const headlineLower = headline.toLowerCase();
  
  // Crypto (highest priority for crypto terms)
  if (headlineLower.includes('crypto') || headlineLower.includes('bitcoin') || headlineLower.includes('ethereum') || 
      headlineLower.includes('btc') || headlineLower.includes('blockchain') || headlineLower.includes('digital currency') ||
      headlineLower.includes('cryptocurrency') || headlineLower.includes('defi')) {
    return 'crypto';
  }
  
  // Earnings (specific earnings-related terms)
  if (headlineLower.includes('earnings') || headlineLower.includes('revenue') || headlineLower.includes('quarterly report') ||
      headlineLower.includes('quarterly') || headlineLower.includes('q1') || headlineLower.includes('q2') || 
      headlineLower.includes('q3') || headlineLower.includes('q4') || headlineLower.includes('eps') ||
      headlineLower.includes('beat estimates') || headlineLower.includes('misses estimates') || 
      headlineLower.includes('guidance') || headlineLower.includes('profit')) {
    return 'earnings';
  }
  
  // Personal Finance (investment advice, retirement, personal money questions)
  if (headlineLower.includes('retirement') || headlineLower.includes('my portfolio') || headlineLower.includes('should i invest') ||
      headlineLower.includes('my money') || headlineLower.includes('my savings') || headlineLower.includes('debt') ||
      headlineLower.includes('financial advice') || headlineLower.includes('invest my') || headlineLower.includes('fire my') ||
      headlineLower.includes('adviser') || headlineLower.includes('advisor') || headlineLower.includes('personal finance') ||
      (headlineLower.includes('i\'m') && (headlineLower.includes('invest') || headlineLower.includes('money'))) ||
      headlineLower.includes('student loan') || headlineLower.includes('mortgage') || headlineLower.includes('401k')) {
    return 'personal-finance';
  }
  
  // Tech (technology companies and AI)
  if (headlineLower.includes('ai ') || headlineLower.includes('artificial intelligence') || headlineLower.includes('machine learning') ||
      headlineLower.includes('tesla') || headlineLower.includes('apple') || headlineLower.includes('microsoft') || 
      headlineLower.includes('google') || headlineLower.includes('meta') || headlineLower.includes('nvidia') ||
      headlineLower.includes('amazon') || headlineLower.includes('technology') || headlineLower.includes('software') ||
      headlineLower.includes('semiconductor') || headlineLower.includes('chip') || headlineLower.includes('tech stock') ||
      headlineLower.includes('ev ') || headlineLower.includes('electric vehicle')) {
    return 'tech';
  }
  
  // Politics (government, policy, political figures)
  if (headlineLower.includes('trump') || headlineLower.includes('biden') || headlineLower.includes('congress') || 
      headlineLower.includes('senate') || headlineLower.includes('government') || headlineLower.includes('policy') || 
      headlineLower.includes('tariff') || headlineLower.includes('trade war') || headlineLower.includes('election') ||
      headlineLower.includes('political') || headlineLower.includes('legislation') || headlineLower.includes('republican') ||
      headlineLower.includes('democrat') || headlineLower.includes('white house') || headlineLower.includes('federal') ||
      headlineLower.includes('regulation') || headlineLower.includes('sanctions')) {
    return 'politics';
  }
  
  // Fed and monetary policy (separate check)
  if (headlineLower.includes('fed ') || headlineLower.includes('federal reserve') || headlineLower.includes('interest rate') ||
      headlineLower.includes('monetary policy') || headlineLower.includes('inflation') || headlineLower.includes('rate cut') ||
      headlineLower.includes('rate hike') || headlineLower.includes('powell') || headlineLower.includes('central bank')) {
    return 'politics';
  }
  
  // Markets (general market activity, indices, trading)
  if (headlineLower.includes('stock market') || headlineLower.includes('market') || headlineLower.includes('s&p 500') || 
      headlineLower.includes('s&p') || headlineLower.includes('dow') || headlineLower.includes('nasdaq') || 
      headlineLower.includes('trading') || headlineLower.includes('bull market') || headlineLower.includes('bear market') ||
      headlineLower.includes('stocks') || headlineLower.includes('index') || headlineLower.includes('etf') ||
      headlineLower.includes('futures') || headlineLower.includes('options') || headlineLower.includes('volatility') ||
      headlineLower.includes('rally') || headlineLower.includes('selloff') || headlineLower.includes('correction')) {
    return 'markets';
  }
  
  return 'general';
}

// Helper function to create paginated response
function paginateItems(items: NewsItem[], page: number, pageSize: number): PaginatedFeed {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / pageSize);
  
  return {
    items: paginatedItems,
    total: items.length,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}


// OPTIMIZED: Fast parallel source fetching with aggressive timeouts
async function fetchFromSource(sourceType: 'rss' | 'finnhub' | 'newsapi' | 'marketaux', forceRefresh: boolean = false): Promise<{items: NewsItem[], errors: string[]}> {
  const metadata = await getSourceMetadata();
  const errors: string[] = [];
  
  // Check if refresh is needed
  if (!forceRefresh && !shouldRefreshSource(sourceType, metadata.lastRefresh[sourceType] || 0)) {
    console.log(`Skipping ${sourceType} refresh - not due yet (last: ${new Date(metadata.lastRefresh[sourceType] || 0).toLocaleTimeString()})`);
    return { items: [], errors: [] };
  }
  
  console.log(`⚡ ${sourceType.toUpperCase()} refresh ${forceRefresh ? '(FORCED)' : '(DUE)'} - last: ${new Date(metadata.lastRefresh[sourceType] || 0).toLocaleTimeString()}`);
  
  console.log(`⚡ FAST: Fetching from ${sourceType} sources...`);
  
  const Parser = require('rss-parser');
  const axios = require('axios');
  
  const parser = new Parser({
    timeout: 3000, // Reduced from 8000 to 3000ms
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MarketSentiment/1.0)',
    }
  });
  
  const items: NewsItem[] = [];
  
  if (sourceType === 'rss') {
    // PROFESSIONAL FINANCIAL NEWS SOURCES (Bloomberg Terminal Style)
    const FAST_RSS_SOURCES = [
      // TOP TIER FINANCIAL NEWS
      { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews', category: 'markets' },
      { name: 'MarketWatch Breaking', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', category: 'markets' },
      { name: 'Financial Times', url: 'https://www.ft.com/rss/home', category: 'general' },
      { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'markets' },
      
      // CNBC PROFESSIONAL FEEDS
      { name: 'CNBC BREAKING', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', category: 'general' },
      { name: 'CNBC MARKETS', url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', category: 'markets' },
      { name: 'CNBC TECH', url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html', category: 'tech' },
      { name: 'CNBC EARNINGS', url: 'https://www.cnbc.com/id/15839135/device/rss/rss.html', category: 'earnings' },
      { name: 'CNBC ECONOMY', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', category: 'politics' },
      
      // SPECIALIZED FINANCIAL
      { name: 'BLOOMBERG MARKETS', url: 'https://feeds.bloomberg.com/markets/news.rss', category: 'markets' },
      { name: 'YAHOO FINANCE', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline', category: 'markets' },
      { name: 'SEEKING ALPHA', url: 'https://seekingalpha.com/feed.xml', category: 'markets' },
      
      // CRYPTO & FINTECH
      { name: 'COINDESK PRO', url: 'https://feeds.feedburner.com/CoinDesk', category: 'crypto' },
      { name: 'COINTELEGRAPH', url: 'https://cointelegraph.com/rss', category: 'crypto' },
      
      // ECONOMIC DATA
      { name: 'FED NEWS', url: 'https://www.federalreserve.gov/feeds/press_all.xml', category: 'politics' },
      { name: 'TREASURY NEWS', url: 'https://home.treasury.gov/rss/press-releases', category: 'politics' },
    ];
    
    // PARALLEL: Fetch all RSS sources simultaneously with aggressive timeout
    const promises = FAST_RSS_SOURCES.map(async (source) => {
      try {
        const result = await Promise.race([
          (async () => {
            const feed = await parser.parseURL(source.url);
            return feed.items.slice(0, 2).map((item: any, index: number) => { // Reduced from 3 to 2 items per source
              const headline = item.title || 'No title';
              return {
                id: `${source.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
                headline,
                source: source.name,
                timestamp: new Date(item.pubDate || Date.now()).getTime(),
                url: item.link,
                type: 'news' as const,
                apiSource: 'rss-feeds' as any,
                category: source.category || categorizeContent(headline),
              };
            });
          })(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('RSS Timeout')), 4000) // Reduced from 8000ms to 4000ms
          )
        ]);
        console.log(`✓ RSS: ${source.name} (${result.length} items)`);
        return result;
      } catch (error) {
        const errorMsg = `${source.name}: ${(error as Error).message}`;
        console.log(`✗ RSS: ${errorMsg}`);
        return []; // Fail silently, don't add to errors array to reduce noise
      }
    });
    
    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    });
    console.log(`✓ RSS Complete: ${items.length} total items from ${FAST_RSS_SOURCES.length} sources`);
  }
  
  if (sourceType === 'finnhub' && process.env.FINNHUB_API_KEY) {
    try {
      const response = await axios.get('https://finnhub.io/api/v1/news', {
        params: {
          category: 'general',
          token: process.env.FINNHUB_API_KEY,
        },
        timeout: 5000 // Reduced from 10000ms to 5000ms
      });
      
      const finnhubItems = response.data.slice(0, 3).map((item: any, index: number) => { // Reduced from 5 to 3 items
        const headline = item.headline;
        return {
          id: `finnhub_${Date.now()}_${index}`,
          headline,
          source: 'Finnhub',
          timestamp: item.datetime * 1000,
          url: item.url,
          type: 'news' as const,
          apiSource: 'finnhub' as const,
          category: categorizeContent(headline),
        };
      });
      
      items.push(...finnhubItems);
      console.log(`✓ API: Finnhub (${finnhubItems.length} items)`);
    } catch (error) {
      console.log(`✗ API: Finnhub failed - ${(error as Error).message}`);
    }
  }
  
  if (sourceType === 'newsapi' && process.env.NEWSAPI_API_KEY) {
    try {
      const response = await axios.get('https://newsdata.io/api/1/news', {
        params: {
          apikey: process.env.NEWSAPI_API_KEY,
          q: 'stocks OR market OR finance OR economy OR earnings',
          category: 'business',
          language: 'en',
          size: 6 // Reduced from 10 to 6
        },
        timeout: 5000 // Reduced from 10000ms to 5000ms
      });
      
      if (response.data && response.data.results) {
        const newsapiItems = response.data.results.slice(0, 3).map((item: any, index: number) => { // Reduced from 5 to 3 items
          const headline = item.title;
          return {
            id: `newsapi_${Date.now()}_${index}`,
            headline,
            source: 'NewsAPI',
            timestamp: new Date(item.pubDate || Date.now()).getTime(),
            url: item.link,
            type: 'news' as const,
            apiSource: 'newsapi' as const,
            category: categorizeContent(headline),
          };
        });
        
        items.push(...newsapiItems);
        console.log(`✓ API: NewsAPI (${newsapiItems.length} items)`);
      }
    } catch (error) {
      console.log(`✗ API: NewsAPI failed - ${(error as Error).message}`);
    }
  }
  
  if (sourceType === 'marketaux' && process.env.MARKETAUX_API_KEY) {
    try {
      const response = await axios.get('https://api.marketaux.com/v1/news/all', {
        params: {
          api_token: process.env.MARKETAUX_API_KEY,
          symbols: 'SPY,QQQ,IWM,TSLA,AAPL,MSFT,NVDA,GOOGL,AMZN,META',
          filter_entities: true,
          language: 'en',
          limit: 8 // Professional terminal needs more items
        },
        timeout: 5000
      });
      
      if (response.data && response.data.data) {
        const marketauxItems = response.data.data.slice(0, 5).map((item: any, index: number) => {
          const headline = item.title;
          return {
            id: `marketaux_${Date.now()}_${index}`,
            headline,
            source: 'MARKETAUX PRO',
            timestamp: new Date(item.published_at || Date.now()).getTime(),
            url: item.url,
            type: 'news' as const,
            apiSource: 'marketaux' as const,
            category: categorizeContent(headline),
          };
        });
        
        items.push(...marketauxItems);
        console.log(`✓ API: MarketAux Pro (${marketauxItems.length} items)`);
      }
    } catch (error) {
      console.log(`✗ API: MarketAux failed - ${(error as Error).message}`);
    }
  }
  
  // ADD ALPHA VANTAGE NEWS (Professional Financial Data)
  if (sourceType === 'newsapi' && process.env.ALPHAVANTAGE_API_KEY) {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          apikey: process.env.ALPHAVANTAGE_API_KEY,
          topics: 'technology,financial_markets,economy_fiscal,ipo,mergers_and_acquisitions',
          limit: 8
        },
        timeout: 6000
      });
      
      if (response.data && response.data.feed) {
        const alphaItems = response.data.feed.slice(0, 4).map((item: any, index: number) => {
          const headline = item.title;
          return {
            id: `alphavantage_${Date.now()}_${index}`,
            headline,
            source: 'ALPHA VANTAGE',
            timestamp: new Date(item.time_published || Date.now()).getTime(),
            url: item.url,
            type: 'news' as const,
            apiSource: 'alphavantage' as const,
            category: categorizeContent(headline),
            sentimentScore: item.overall_sentiment_score ? Math.round((parseFloat(item.overall_sentiment_score) + 1) * 5) : undefined,
          };
        });
        
        items.push(...alphaItems);
        console.log(`✓ API: Alpha Vantage Pro (${alphaItems.length} items)`);
      }
    } catch (error) {
      console.log(`✗ API: Alpha Vantage failed - ${(error as Error).message}`);
    }
  }
  
  // Update metadata
  metadata.lastRefresh[sourceType] = Date.now();
  metadata.errors[sourceType] = errors;
  metadata.totalFetches = (metadata.totalFetches || 0) + 1;
  await saveSourceMetadata(metadata);
  
  console.log(`✓ ${sourceType} fetch complete: ${items.length} items, ${errors.length} errors`);
  return { items, errors };
}

// OPTIMIZED: Super-fast parallel data fetching 
async function fetchLiveData(forceRefresh: boolean = false): Promise<NewsItem[]> {
  console.log('⚡ FAST FETCH: Starting parallel data fetch...');
  const startTime = Date.now();

  try {
    // PARALLEL: Launch all source fetches simultaneously  
    const sourceTypes: ('rss' | 'finnhub' | 'newsapi' | 'marketaux')[] = ['rss', 'finnhub', 'newsapi', 'marketaux'];
    
    const fetchPromises = sourceTypes.map(async (sourceType) => {
      try {
        const result = await fetchFromSource(sourceType, forceRefresh);
        return { sourceType, ...result };
      } catch (error) {
        console.log(`✗ PARALLEL: ${sourceType} failed - ${(error as Error).message}`);
        return { sourceType, items: [], errors: [`${sourceType}: ${(error as Error).message}`] };
      }
    });

    // Wait for all sources to complete (or timeout)
    const results = await Promise.allSettled(fetchPromises);
    
    const allHeadlines: NewsItem[] = [];
    const allErrors: string[] = [];
    
    results.forEach((result, index) => {
      const sourceType = sourceTypes[index];
      if (result.status === 'fulfilled') {
        allHeadlines.push(...result.value.items);
        allErrors.push(...result.value.errors);
        console.log(`✓ PARALLEL: ${sourceType} completed (${result.value.items.length} items)`);
      } else {
        console.log(`✗ PARALLEL: ${sourceType} rejected - ${result.reason}`);
        allErrors.push(`${sourceType}: Promise rejected`);
      }
    });

    const fetchTime = Date.now() - startTime;
    console.log(`⚡ FAST FETCH Complete: ${allHeadlines.length} headlines in ${fetchTime}ms (${allErrors.length} errors)`);
    
    // Minimal fallback system - only if absolutely no data
    if (allHeadlines.length === 0) {
      console.log('⚠ No headlines fetched, adding minimal fallback...');
      const quickFallback = [
        {
          id: `quick_news_${Date.now()}`,
          headline: "Market data loading - refresh to try again",
          source: "System",
          timestamp: Date.now(),
          type: 'news' as const,
          apiSource: 'mock' as const,
          category: 'general' as const,
        }
      ];
      allHeadlines.push(...quickFallback);
    }
    
    return allHeadlines;
  } catch (error) {
    console.error('Error in fetchLiveData:', error);
    // Return mock data on error
    return [
      {
        id: `live_error_${Date.now()}`,
        headline: "Live data temporarily unavailable - using cached data",
        source: "System Message",
        timestamp: Date.now(),
        type: 'news' as const,
        apiSource: 'mock' as const,
        category: 'general' as const,
      }
    ];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isLiveMode = searchParams.get('live') === 'true';
  const forceRefresh = searchParams.get('force') === 'true';
  const separateFeeds = searchParams.get('separate') === 'true';
  const paginated = searchParams.get('paginated') === 'true';
  const newsPage = parseInt(searchParams.get('newsPage') || '1');
  const socialPage = parseInt(searchParams.get('socialPage') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const category = searchParams.get('category') || null;

  try {
    // Ensure data directory exists
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Load existing headlines first
    let existingHeadlines: NewsItem[] = [];
    try {
      const data = await fs.readFile(HEADLINES_FILE, 'utf-8');
      existingHeadlines = JSON.parse(data);
    } catch {
      // File doesn't exist yet, that's ok
    }

    // Clean up old data (24-hour retention)
    const cutoffTime = Date.now() - DATA_RETENTION_PERIOD;
    const recentExistingHeadlines = existingHeadlines.filter(item => item.timestamp > cutoffTime);
    
    let finalHeadlines = recentExistingHeadlines;

    // If live mode or force refresh, fetch fresh data and merge with existing
    if (isLiveMode || forceRefresh) {
      console.log(`${forceRefresh ? 'Force refresh' : 'Live mode'}: Fetching fresh data...`);
      const newHeadlines = await fetchLiveData(forceRefresh);
      
      if (newHeadlines.length > 0) {
        // Merge new and existing headlines with advanced duplicate detection
        const allHeadlines = [...recentExistingHeadlines];
        
        // Add new headlines only if they're not duplicates
        for (const newItem of newHeadlines) {
          if (!isDuplicate(newItem, allHeadlines)) {
            allHeadlines.push(newItem);
          }
        }

        // Sort by timestamp (newest first) and keep latest 200 within 24 hours
        allHeadlines.sort((a, b) => b.timestamp - a.timestamp);
        finalHeadlines = allHeadlines.slice(0, 200);

        // Save updated headlines
        await fs.writeFile(HEADLINES_FILE, JSON.stringify(finalHeadlines, null, 2));
        
        console.log(`${forceRefresh ? 'Force refresh' : 'Live mode'}: Added ${newHeadlines.length} new headlines, ${finalHeadlines.length - recentExistingHeadlines.length} unique, total: ${finalHeadlines.length}`);
      }
    }

    // Use final headlines (either existing or refreshed)
    let headlines = finalHeadlines;
    
    // Add missing fields to existing headlines and ensure data consistency
    headlines = headlines.map(item => ({
      ...item,
      type: item.type || (item.source.startsWith('@') ? 'social' : 'news'),
      apiSource: item.apiSource || (
        item.source === 'Finnhub' ? 'finnhub' :
        item.source.startsWith('@') ? 'social-rss' :
        (item.source === 'Live Mock Data' || item.source === 'System Message') ? 'mock' :
        'rss-feeds' // All RSS feeds should show 'rss-feeds' as API source
      ),
      category: item.category || categorizeContent(item.headline),
    }));
    
    // Save updated headlines if any fields were added
    if (headlines.length > 0) {
      await fs.writeFile(HEADLINES_FILE, JSON.stringify(headlines, null, 2));
    }
    
    // Filter by category if specified
    let filteredHeadlines = headlines;
    if (category && category !== 'all') {
      filteredHeadlines = headlines.filter(item => item.category === category);
    }
    
    if (separateFeeds) {
      // Return separated feeds - social will be empty now
      const newsItems = filteredHeadlines.filter(item => item.type === 'news');
      const socialItems: NewsItem[] = []; // No social feeds available
      
      console.log(`Returning separated feeds: ${newsItems.length} news, ${socialItems.length} social`);
      
      if (paginated) {
        // Return paginated separated feeds
        const metadata = await getSourceMetadata();
        return NextResponse.json({
          news: paginateItems(newsItems, newsPage, pageSize),
          social: paginateItems(socialItems, socialPage, pageSize),
          sourceStatus: {
            lastRefresh: metadata.lastRefresh,
            refreshIntervals: REFRESH_INTERVALS,
            errors: metadata.errors,
            totalFetches: metadata.totalFetches
          },
        });
      }
      
      return NextResponse.json({
        news: newsItems,
        social: socialItems
      });
    }
    
    return NextResponse.json(filteredHeadlines);
  } catch (error) {
    console.error('Error in headlines API:', error);
    
    // Return sample data if file doesn't exist
    const sampleData: NewsItem[] = [
      {
        id: "sample_error_1",
        headline: "[NO DATA] Please run the headline fetcher to load real data",
        source: "System Message",
        timestamp: Date.now(),
        summary: "Run 'npm run fetch-headlines' to populate with real market data.",
        sentimentScore: 5,
        tickers: ["SPY", "QQQ"],
        type: 'news',
        apiSource: 'mock',
        category: 'general'
      }
    ];
    
    if (separateFeeds) {
      if (paginated) {
        return NextResponse.json({
          news: paginateItems(sampleData, newsPage, pageSize),
          social: paginateItems([], socialPage, pageSize)
        });
      }
      return NextResponse.json({
        news: sampleData,
        social: []
      });
    }
    
    return NextResponse.json(sampleData);
  }
}