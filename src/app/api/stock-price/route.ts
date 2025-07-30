import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = 'co50ivpr01qnik2v7320co50ivpr01qnik2v732g'; // From .env.example
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  if (!FINNHUB_API_KEY) {
    return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 });
  }

  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`;
    
    console.log(`Fetching stock price for ${symbol} from Finnhub...`);
    
    const response = await fetch(url, {
      headers: {
        'X-Finnhub-Token': FINNHUB_API_KEY,
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Finnhub API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Finnhub API error: ${response.status} - ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Check if we got valid data
    if (data.c === 0 && data.d === 0 && data.dp === 0) {
      return NextResponse.json({ error: 'Symbol not found or market closed' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching stock price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock price from Finnhub' }, 
      { status: 500 }
    );
  }
}