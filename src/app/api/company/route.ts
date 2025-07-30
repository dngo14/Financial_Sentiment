import { NextResponse } from 'next/server';

const POLYGON_API_KEY = 'Jp8Qyl_4vHhTJMjcqiE4SPhGHhdjY35f';
const POLYGON_BASE_URL = 'https://api.polygon.io';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const type = searchParams.get('type'); // 'financials', 'news', 'overview', or 'price'

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: 'Type parameter is required (financials, news, overview, or price)' }, { status: 400 });
  }

  if (!POLYGON_API_KEY) {
    return NextResponse.json({ error: 'Polygon API key not configured' }, { status: 500 });
  }

  try {
    let url = '';
    
    if (type === 'financials') {
      url = `${POLYGON_BASE_URL}/vX/reference/financials?ticker=${ticker.toUpperCase()}&order=desc&limit=10&sort=filing_date&apikey=${POLYGON_API_KEY}`;
    } else if (type === 'news') {
      url = `${POLYGON_BASE_URL}/v2/reference/news?ticker=${ticker.toUpperCase()}&order=desc&limit=20&sort=published_utc&apikey=${POLYGON_API_KEY}`;
    } else if (type === 'overview') {
      url = `${POLYGON_BASE_URL}/v3/reference/tickers/${ticker.toUpperCase()}?apikey=${POLYGON_API_KEY}`;
    } else if (type === 'price') {
      url = `${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker.toUpperCase()}/prev?adjusted=true&apikey=${POLYGON_API_KEY}`;
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "financials", "news", "overview", or "price"' }, { status: 400 });
    }

    console.log(`Fetching ${type} for ${ticker} from Polygon.io...`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${POLYGON_API_KEY}`,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Polygon API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Polygon API error: ${response.status} - ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      return NextResponse.json({ error: data.error || 'Polygon API returned an error' }, { status: 400 });
    }

    // Transform the data for consistent response format
    if (type === 'financials') {
      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        type: 'financials',
        data: data.results || [],
        count: data.count || 0,
        next_url: data.next_url || null
      });
    } else if (type === 'news') {
      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        type: 'news',
        data: data.results || [],
        count: data.count || 0,
        next_url: data.next_url || null
      });
    } else if (type === 'overview') {
      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        type: 'overview',
        data: data.results || data,
        count: 1,
        next_url: null
      });
    } else if (type === 'price') {
      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        type: 'price',
        data: data,
        count: data.resultsCount || 0,
        next_url: null
      });
    }

  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company data from Polygon.io' }, 
      { status: 500 }
    );
  }
}