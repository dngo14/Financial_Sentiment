import { NextResponse } from 'next/server';

export interface RedditSentiment {
  no_of_comments: number;
  sentiment: string;
  sentiment_score: number;
  ticker: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date'); // Optional date parameter

  try {
    let url = 'https://tradestie.com/api/v1/apps/reddit';
    
    // Add date parameter if provided (format: YYYY-MM-DD)
    if (date) {
      url += `?date=${date}`;
    }
    
    console.log(`Fetching Reddit WallStreetBets sentiment data from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarketSentiment/1.0)',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      method: 'GET',
      next: { revalidate: 900 }, // Cache for 15 minutes
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Unable to read error response';
      }
      
      console.error(`Tradestie API error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorText
      });
      
      // Return mock data when API is experiencing issues
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        console.log('API server error detected, returning mock data with detailed status info...');
        const mockData = getMockRedditData();
        return NextResponse.json({
          data: mockData,
          total_count: mockData.length,
          source: `Mock Data - Tradestie API Status: ${response.status} ${response.statusText}`,
          last_updated: new Date().toISOString(),
          update_frequency: '15 minutes (estimated from API docs)',
          date_requested: date || 'latest',
          is_mock: true,
          api_status: {
            endpoint: url,
            status_code: response.status,
            status_text: response.statusText,
            error_details: errorText,
            retry_suggestion: 'API appears to be experiencing server issues. Mock data provided for testing.',
            last_checked: new Date().toISOString()
          }
        });
      }
      
      return NextResponse.json(
        { 
          error: `Tradestie API error: ${response.status} - ${response.statusText}`,
          details: errorText,
          endpoint: url,
          timestamp: new Date().toISOString()
        }, 
        { status: response.status }
      );
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API returned non-JSON response:', {
        contentType,
        status: response.status,
        statusText: response.statusText
      });
      
      // Return mock data when API returns HTML error pages
      const mockData = getMockRedditData();
      return NextResponse.json({
        data: mockData,
        total_count: mockData.length,
        source: `Mock Data - API returned ${contentType || 'non-JSON'} response`,
        last_updated: new Date().toISOString(),
        update_frequency: '15 minutes',
        date_requested: date || 'latest',
        is_mock: true,
        api_status: {
          error: 'API returned HTML error page instead of JSON data',
          content_type: contentType,
          status_code: response.status,
          status_text: response.statusText,
          retry_suggestion: 'Tradestie API is returning HTML error pages. Mock data provided.',
          last_checked: new Date().toISOString()
        }
      });
    }

    let data: RedditSentiment[];
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      
      // Return mock data when JSON parsing fails
      const mockData = getMockRedditData();
      return NextResponse.json({
        data: mockData,
        total_count: mockData.length,
        source: 'Mock Data - JSON Parse Error',
        last_updated: new Date().toISOString(),
        update_frequency: '15 minutes',
        date_requested: date || 'latest',
        is_mock: true,
        api_status: {
          error: 'Failed to parse API response as JSON',
          parse_error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error',
          retry_suggestion: 'API is returning invalid JSON. Using mock data for testing.',
          last_checked: new Date().toISOString()
        }
      });
    }
    
    // Validate data structure
    if (!Array.isArray(data)) {
      console.error('Invalid data format received from Tradestie API:', data);
      
      // Return mock data on invalid format
      const mockData = getMockRedditData();
      return NextResponse.json({
        data: mockData,
        total_count: mockData.length,
        source: 'Mock Data (Invalid API Response Format)',
        last_updated: new Date().toISOString(),
        update_frequency: '15 minutes',
        date_requested: date || 'latest',
        is_mock: true,
        api_status: {
          error: 'API returned non-array data format',
          received_data_type: typeof data,
          endpoint: url
        }
      });
    }

    // Filter and enhance the data
    const enhancedData = data
      .filter(item => item.ticker && item.no_of_comments > 0) // Only valid tickers with comments
      .map(item => ({
        ...item,
        sentiment_category: getSentimentCategory(item.sentiment_score),
        comment_volume: getCommentVolumeCategory(item.no_of_comments),
        ticker: item.ticker.toUpperCase(),
        last_updated: new Date().toISOString()
      }))
      .slice(0, 50); // Limit to top 50

    console.log(`Successfully fetched ${enhancedData.length} Reddit sentiment entries from Tradestie API`);

    return NextResponse.json({
      data: enhancedData,
      total_count: enhancedData.length,
      source: 'Tradestie - Reddit WallStreetBets API',
      last_updated: new Date().toISOString(),
      update_frequency: '15 minutes',
      date_requested: date || 'latest',
      api_status: {
        status: 'operational',
        endpoint: url,
        response_time: 'success',
        last_checked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching Reddit sentiment data:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return mock data on any fetch error
    const mockData = getMockRedditData();
    return NextResponse.json({
      data: mockData,
      total_count: mockData.length,
      source: 'Mock Data (Network/Connection Error)',
      last_updated: new Date().toISOString(),
      update_frequency: '15 minutes',
      date_requested: date || 'latest',
      is_mock: true,
      api_status: {
        error: error instanceof Error ? error.message : 'Unknown connection error',
        endpoint: 'https://tradestie.com/api/v1/apps/reddit',
        last_checked: new Date().toISOString(),
        retry_suggestion: 'Check network connection or try again later'
      }
    }, { status: 200 }); // Return 200 with mock data instead of error
  }
}

// Helper function to categorize sentiment scores
function getSentimentCategory(score: number): 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish' {
  if (score >= 0.15) return 'Very Bullish';
  if (score >= 0.05) return 'Bullish';
  if (score >= -0.05) return 'Neutral';
  if (score >= -0.15) return 'Bearish';
  return 'Very Bearish';
}

// Helper function to categorize comment volume
function getCommentVolumeCategory(comments: number): 'Very High' | 'High' | 'Medium' | 'Low' {
  if (comments >= 100) return 'Very High';
  if (comments >= 50) return 'High';
  if (comments >= 20) return 'Medium';
  return 'Low';
}

// Mock data for when API is unavailable - enhanced with more realistic data
function getMockRedditData(): any[] {
  return [
    {
      no_of_comments: 342,
      sentiment: "Very Bullish",
      sentiment_score: 0.22,
      ticker: "GME",
      sentiment_category: "Very Bullish",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 289,
      sentiment: "Bullish",
      sentiment_score: 0.16,
      ticker: "TSLA",
      sentiment_category: "Very Bullish",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 234,
      sentiment: "Bullish",
      sentiment_score: 0.14,
      ticker: "NVDA",
      sentiment_category: "Bullish",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 187,
      sentiment: "Bullish",
      sentiment_score: 0.11,
      ticker: "AMD",
      sentiment_category: "Bullish",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 156,
      sentiment: "Neutral",
      sentiment_score: 0.03,
      ticker: "AAPL",
      sentiment_category: "Neutral",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 142,
      sentiment: "Bearish",
      sentiment_score: -0.09,
      ticker: "SPY",
      sentiment_category: "Bearish",
      comment_volume: "Very High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 98,
      sentiment: "Bullish",
      sentiment_score: 0.08,
      ticker: "PLTR",
      sentiment_category: "Bullish",
      comment_volume: "High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 87,
      sentiment: "Very Bearish",
      sentiment_score: -0.18,
      ticker: "META",
      sentiment_category: "Very Bearish",
      comment_volume: "High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 76,
      sentiment: "Neutral",
      sentiment_score: -0.02,
      ticker: "MSFT",
      sentiment_category: "Neutral",
      comment_volume: "High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 65,
      sentiment: "Bullish",
      sentiment_score: 0.12,
      ticker: "AMZN",
      sentiment_category: "Bullish",
      comment_volume: "High",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 58,
      sentiment: "Bullish",
      sentiment_score: 0.19,
      ticker: "MSTR",
      sentiment_category: "Very Bullish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 52,
      sentiment: "Bearish",  
      sentiment_score: -0.11,
      ticker: "QQQ",
      sentiment_category: "Bearish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 47,
      sentiment: "Bullish",
      sentiment_score: 0.07,
      ticker: "GOOGL",
      sentiment_category: "Bullish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 41,
      sentiment: "Very Bullish",
      sentiment_score: 0.21,
      ticker: "SMCI",
      sentiment_category: "Very Bullish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 38,
      sentiment: "Bearish",
      sentiment_score: -0.13,
      ticker: "COIN",
      sentiment_category: "Bearish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 34,
      sentiment: "Neutral",
      sentiment_score: 0.01,
      ticker: "DIS",
      sentiment_category: "Neutral",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 29,
      sentiment: "Bullish",
      sentiment_score: 0.15,
      ticker: "SOFI",
      sentiment_category: "Very Bullish",
      comment_volume: "Medium",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 26,
      sentiment: "Very Bearish",
      sentiment_score: -0.24,
      ticker: "NKLA",
      sentiment_category: "Very Bearish",
      comment_volume: "Low",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 23,
      sentiment: "Bullish",
      sentiment_score: 0.06,
      ticker: "BABA",
      sentiment_category: "Bullish",
      comment_volume: "Low",
      last_updated: new Date().toISOString()
    },
    {
      no_of_comments: 21,
      sentiment: "Bearish",
      sentiment_score: -0.08,
      ticker: "HOOD",
      sentiment_category: "Bearish",
      comment_volume: "Low",
      last_updated: new Date().toISOString()
    }
  ];
}