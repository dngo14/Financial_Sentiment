interface APICallRecord {
  timestamp: number;
  endpoint: string;
  provider: 'finnhub' | 'polygon';
  symbol?: string;
}

interface RateLimitStatus {
  remainingCalls: number;
  nextAvailableTime: number;
  recentCalls: APICallRecord[];
  isLimited: boolean;
}

class APIRateLimiter {
  private static instance: APIRateLimiter;
  private readonly RATE_LIMIT = 5; // 5 calls per minute (combined Finnhub + Polygon)
  private readonly WINDOW_MS = 60 * 1000; // 1 minute window
  private readonly STORAGE_KEY = 'api_rate_limit_calls';
  
  // Only these providers are rate limited
  private readonly RATE_LIMITED_PROVIDERS = ['finnhub', 'polygon'] as const;
  
  private constructor() {}
  
  static getInstance(): APIRateLimiter {
    if (!APIRateLimiter.instance) {
      APIRateLimiter.instance = new APIRateLimiter();
    }
    return APIRateLimiter.instance;
  }
  
  private getStoredCalls(): APICallRecord[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const calls: APICallRecord[] = JSON.parse(stored);
      const now = Date.now();
      
      // Filter out calls older than the window
      const recentCalls = calls.filter(call => 
        (now - call.timestamp) < this.WINDOW_MS
      );
      
      // Update storage with filtered calls
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentCalls));
      return recentCalls;
    } catch {
      return [];
    }
  }
  
  private storeCalls(calls: APICallRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(calls));
    } catch {
      // Storage failed, continue without persistence
    }
  }
  
  getStatus(): RateLimitStatus {
    const recentCalls = this.getStoredCalls();
    const now = Date.now();
    
    const remainingCalls = Math.max(0, this.RATE_LIMIT - recentCalls.length);
    const isLimited = remainingCalls === 0;
    
    let nextAvailableTime = now;
    if (isLimited && recentCalls.length > 0) {
      // Find the oldest call and add the window duration
      const oldestCall = Math.min(...recentCalls.map(call => call.timestamp));
      nextAvailableTime = oldestCall + this.WINDOW_MS;
    }
    
    return {
      remainingCalls,
      nextAvailableTime,
      recentCalls,
      isLimited
    };
  }
  
  async executeCall<T>(
    apiFunction: () => Promise<T>,
    endpoint: string,
    provider: 'finnhub' | 'polygon',
    symbol?: string
  ): Promise<T> {
    const status = this.getStatus();
    
    if (status.isLimited) {
      const waitTime = Math.max(0, status.nextAvailableTime - Date.now());
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Next call available in ${Math.ceil(waitTime / 1000)} seconds.`);
      }
    }
    
    try {
      const result = await apiFunction();
      
      // Record the successful call
      const calls = this.getStoredCalls();
      calls.push({
        timestamp: Date.now(),
        endpoint,
        provider,
        symbol
      });
      this.storeCalls(calls);
      
      return result;
    } catch (error) {
      // Don't record failed calls against the quota
      throw error;
    }
  }
  
  // For components to check status without making calls
  canMakeCall(): boolean {
    return !this.getStatus().isLimited;
  }
  
  getTimeUntilNextCall(): number {
    const status = this.getStatus();
    if (!status.isLimited) return 0;
    return Math.max(0, status.nextAvailableTime - Date.now());
  }
  
  // Get formatted status for UI display
  getDisplayStatus(): {
    text: string;
    color: string;
    remainingCalls: number;
    nextCallIn: number;
  } {
    const status = this.getStatus();
    const nextCallIn = this.getTimeUntilNextCall();
    
    let text = `${status.remainingCalls}/${this.RATE_LIMIT} API calls`;
    let color = 'text-green-600 dark:text-green-400';
    
    if (status.remainingCalls <= 1) {
      color = 'text-red-600 dark:text-red-400';
    } else if (status.remainingCalls <= 2) {
      color = 'text-yellow-600 dark:text-yellow-400';
    }
    
    if (nextCallIn > 0) {
      const seconds = Math.ceil(nextCallIn / 1000);
      text += ` (${seconds}s wait)`;
    }
    
    return {
      text: text + ' (Finnhub/Polygon)',
      color,
      remainingCalls: status.remainingCalls,
      nextCallIn
    };
  }
}

// Export the rate limiter instance
export const apiRateLimiter = APIRateLimiter.getInstance();

// Helper function to check if an endpoint should be rate limited
export function shouldRateLimit(endpoint: string): boolean {
  return endpoint.includes('finnhub') || endpoint.includes('polygon');
}

// Helper function to get provider from endpoint
export function getProviderFromEndpoint(endpoint: string): 'finnhub' | 'polygon' | null {
  if (endpoint.includes('finnhub')) return 'finnhub';
  if (endpoint.includes('polygon')) return 'polygon';
  return null;
}