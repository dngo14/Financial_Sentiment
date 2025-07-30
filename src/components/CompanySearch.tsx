'use client';

import { useState } from 'react';
import { CompanyData, PolygonFinancials, PolygonNews, PolygonCompanyOverview, PolygonStockPrice } from '../lib/types';

interface CompanySearchProps {
  onClose: () => void;
}

export default function CompanySearch({ onClose }: CompanySearchProps) {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'news'>('overview');
  const [overviewData, setOverviewData] = useState<CompanyData | null>(null);
  const [priceData, setPriceData] = useState<CompanyData | null>(null);
  const [financialData, setFinancialData] = useState<CompanyData | null>(null);
  const [newsData, setNewsData] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchCompany = async (searchTicker: string) => {
    if (!searchTicker.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch overview, price, financials, and news in parallel
      const [overviewResponse, priceResponse, financialsResponse, newsResponse] = await Promise.all([
        fetch(`/api/company?ticker=${searchTicker.toUpperCase()}&type=overview`),
        fetch(`/api/company?ticker=${searchTicker.toUpperCase()}&type=price`),
        fetch(`/api/company?ticker=${searchTicker.toUpperCase()}&type=financials`),
        fetch(`/api/company?ticker=${searchTicker.toUpperCase()}&type=news`)
      ]);

      if (!overviewResponse.ok) {
        const errorData = await overviewResponse.json();
        throw new Error(errorData.error || 'Failed to fetch company overview');
      }

      if (!priceResponse.ok) {
        const errorData = await priceResponse.json();
        throw new Error(errorData.error || 'Failed to fetch stock price');
      }

      if (!financialsResponse.ok) {
        const errorData = await financialsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch financial data');
      }

      if (!newsResponse.ok) {
        const errorData = await newsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch news data');
      }

      const [overview, price, financials, news] = await Promise.all([
        overviewResponse.json(),
        priceResponse.json(),
        financialsResponse.json(),
        newsResponse.json()
      ]);

      setOverviewData(overview);
      setPriceData(price);
      setFinancialData(financials);
      setNewsData(news);
      
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch company data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCompany(ticker);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const calculatePriceChange = (current: number, previous: number) => {
    const change = current - previous;
    const changePercent = ((change / previous) * 100).toFixed(2);
    return {
      change: change.toFixed(2),
      changePercent,
      isPositive: change >= 0
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-mono">
            COMPANY_RESEARCH_TERMINAL
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-mono"
          >
            ×
          </button>
        </div>

        {/* Search Form */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol (e.g., AAPL)"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                loading || !ticker.trim()
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-green-500 text-green-400 hover:bg-green-500/10'
              }`}
            >
              {loading ? 'SEARCHING...' : 'SEARCH'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-500/30">
            <div className="text-red-600 dark:text-red-400 font-mono text-sm">
              ERROR: {error}
            </div>
          </div>
        )}

        {/* Results */}
        {(overviewData || priceData || financialData || newsData) && (
          <div className="flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 font-mono text-sm border-b-2 transition-all ${
                    activeTab === 'overview'
                      ? 'border-purple-400 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                  }`}
                >
                  OVERVIEW
                </button>
                <button
                  onClick={() => setActiveTab('financials')}
                  className={`px-4 py-3 font-mono text-sm border-b-2 transition-all ${
                    activeTab === 'financials'
                      ? 'border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                  }`}
                >
                  FINANCIALS
                </button>
                <button
                  onClick={() => setActiveTab('news')}
                  className={`px-4 py-3 font-mono text-sm border-b-2 transition-all ${
                    activeTab === 'news'
                      ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                  }`}
                >
                  NEWS [{newsData?.count || 0}]
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="h-96 overflow-y-auto p-4">
              {activeTab === 'overview' && overviewData && (
                <div className="space-y-6">
                  {(() => {
                    const overview = overviewData.data as PolygonCompanyOverview;
                    return (
                      <>
                        {/* Company Header */}
                        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              {overview.branding?.logo_url && (
                                <img 
                                  src={overview.branding.logo_url} 
                                  alt={`${overview.name} logo`}
                                  className="w-12 h-12 rounded object-contain bg-white p-1"
                                />
                              )}
                              <div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
                                  {overview.name}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono rounded-full">
                                    {overview.ticker}
                                  </span>
                                  <span className="text-slate-600 dark:text-gray-400 font-mono text-sm">
                                    {overview.primary_exchange}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-mono rounded-full ${
                                    overview.active 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {overview.active ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {overview.homepage_url && (
                              <a 
                                href={overview.homepage_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono text-sm border border-blue-300 dark:border-blue-600 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                              >
                                WEBSITE ↗
                              </a>
                            )}
                          </div>
                          
                          {overview.description && (
                            <p className="text-slate-700 dark:text-gray-300 leading-relaxed text-sm">
                              {overview.description}
                            </p>
                          )}
                        </div>

                        {/* Stock Price */}
                        {priceData && (() => {
                          const stockPrice = priceData.data as PolygonStockPrice;
                          if (stockPrice.results && stockPrice.results.length > 0) {
                            const result = stockPrice.results[0];
                            const priceChange = calculatePriceChange(result.c, result.o);
                            return (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                                      <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                                      LIVE STOCK PRICE
                                    </h3>
                                    <div className="flex items-baseline gap-3">
                                      <span className="text-3xl font-bold text-slate-800 dark:text-white font-mono">
                                        {formatPrice(result.c)}
                                      </span>
                                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono ${
                                        priceChange.isPositive 
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                      }`}>
                                        <span>{priceChange.isPositive ? '↗' : '↘'}</span>
                                        <span>{priceChange.isPositive ? '+' : ''}{priceChange.change}</span>
                                        <span>({priceChange.isPositive ? '+' : ''}{priceChange.changePercent}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">PREVIOUS CLOSE</div>
                                    <div className="text-lg font-bold text-slate-600 dark:text-gray-300 font-mono">
                                      {formatPrice(result.o)}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">HIGH</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                      {formatPrice(result.h)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">LOW</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                      {formatPrice(result.l)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">VOLUME</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                      {result.v.toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">VWAP</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                      {formatPrice(result.vw)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 text-xs text-slate-500 dark:text-gray-400 font-mono text-center">
                                  Last updated: {new Date(result.t).toLocaleString()}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {overview.market_cap && (
                            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MARKET CAP</div>
                              <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                                {formatCurrency(overview.market_cap)}
                              </div>
                            </div>
                          )}
                          {overview.total_employees && (
                            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">EMPLOYEES</div>
                              <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                                {overview.total_employees.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {overview.share_class_shares_outstanding && (
                            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">SHARES OUT</div>
                              <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                                {(overview.share_class_shares_outstanding / 1e6).toFixed(1)}M
                              </div>
                            </div>
                          )}
                          {overview.list_date && (
                            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">LISTED</div>
                              <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                                {formatDate(overview.list_date)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Company Details */}
                        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
                          <h4 className="font-mono text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            COMPANY DETAILS
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">TYPE</span>
                                <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.type}</div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">MARKET</span>
                                <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.market}</div>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">CURRENCY</span>
                                <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.currency_name}</div>
                              </div>
                              {overview.cik && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">CIK</span>
                                  <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.cik}</div>
                                </div>
                              )}
                            </div>
                            <div className="space-y-3">
                              {overview.sic_description && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">INDUSTRY</span>
                                  <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.sic_description}</div>
                                </div>
                              )}
                              {overview.phone_number && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">PHONE</span>
                                  <div className="text-sm text-slate-800 dark:text-white font-mono">{overview.phone_number}</div>
                                </div>
                              )}
                              {overview.address && (
                                <div>
                                  <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">ADDRESS</span>
                                  <div className="text-sm text-slate-800 dark:text-white font-mono">
                                    {[overview.address.address1, overview.address.city, overview.address.state, overview.address.postal_code].filter(Boolean).join(', ')}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'financials' && financialData && (
                <div className="space-y-6">
                  {/* Financial Data Header */}
                  <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      RECENT FINANCIAL STATEMENTS
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 font-mono text-sm">
                      Latest available annual and quarterly reports (past 2 years)
                    </p>
                  </div>

                  {/* Separate Annual and Quarterly Data */}
                  {['annual', 'quarterly'].map(timeframeType => {
                    const filteredData = (financialData.data as PolygonFinancials[])
                      .filter(f => f.timeframe === timeframeType)
                      .sort((a, b) => new Date(b.filing_date).getTime() - new Date(a.filing_date).getTime());
                    
                    if (filteredData.length === 0) return null;
                    
                    return (
                      <div key={timeframeType} className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-200 dark:border-gray-700">
                          <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white uppercase">
                            {timeframeType} Reports
                          </h3>
                          <span className={`px-3 py-1 text-xs font-mono rounded-full ${
                            timeframeType === 'annual' 
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {filteredData.length} {filteredData.length === 1 ? 'PERIOD' : 'PERIODS'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                            Most Recent: {formatDate(filteredData[0]?.filing_date)}
                          </span>
                        </div>
                        
                        {/* Financial Reports */}
                        <div className="space-y-4">
                          {filteredData.map((financial, index) => (
                            <div key={index} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              {/* Report Header */}
                              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-750 p-4 border-b border-slate-200 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-mono text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                      <span className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                      {financial.fiscal_period} {financial.fiscal_year}
                                      {index === 0 && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full ml-2">LATEST</span>}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2">
                                      <span className="text-xs text-slate-600 dark:text-gray-400 font-mono">
                                        📊 Filed: {formatDate(financial.filing_date)}
                                      </span>
                                      <span className="text-xs text-slate-600 dark:text-gray-400 font-mono">
                                        📅 Period: {formatDate(financial.start_date)} - {formatDate(financial.end_date)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 text-xs font-mono rounded-full ${
                                      timeframeType === 'annual' 
                                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    }`}>
                                      {financial.timeframe.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                                      Report #{index + 1}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Financial Metrics */}
                              <div className="p-6">
                                {/* Income Statement */}
                                {financial.financials.income_statement && (
                                  <div className="mb-8">
                                    <h5 className="font-mono text-base font-bold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gray-700">
                                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                      INCOME STATEMENT
                                      <span className="text-xs text-slate-500 dark:text-gray-400 font-normal ml-auto">Revenue & Profitability</span>
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {financial.financials.income_statement.revenues && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">REVENUE</div>
                                          <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                            {formatCurrency(financial.financials.income_statement.revenues.value)}
                                          </div>
                                        </div>
                                      )}
                                      {financial.financials.income_statement.gross_profit && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">GROSS PROFIT</div>
                                          <div className={`text-sm font-bold font-mono ${
                                            financial.financials.income_statement.gross_profit.value >= 0 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {formatCurrency(financial.financials.income_statement.gross_profit.value)}
                                          </div>
                                        </div>
                                      )}
                                      {financial.financials.income_statement.net_income_loss && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET INCOME</div>
                                          <div className={`text-sm font-bold font-mono ${
                                            financial.financials.income_statement.net_income_loss.value >= 0 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {formatCurrency(financial.financials.income_statement.net_income_loss.value)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Balance Sheet */}
                                {financial.financials.balance_sheet && (
                                  <div className="mb-8">
                                    <h5 className="font-mono text-base font-bold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gray-700">
                                      <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                                      BALANCE SHEET
                                      <span className="text-xs text-slate-500 dark:text-gray-400 font-normal ml-auto">Assets & Liabilities</span>
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {financial.financials.balance_sheet.assets && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL ASSETS</div>
                                          <div className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                                            {formatCurrency(financial.financials.balance_sheet.assets.value)}
                                          </div>
                                        </div>
                                      )}
                                      {financial.financials.balance_sheet.liabilities && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">LIABILITIES</div>
                                          <div className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                                            {formatCurrency(financial.financials.balance_sheet.liabilities.value)}
                                          </div>
                                        </div>
                                      )}
                                      {financial.financials.balance_sheet.equity && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">EQUITY</div>
                                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {formatCurrency(financial.financials.balance_sheet.equity.value)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Cash Flow */}
                                {financial.financials.cash_flow_statement && (
                                  <div>
                                    <h5 className="font-mono text-base font-bold text-slate-700 dark:text-gray-300 mb-4 flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-gray-700">
                                      <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                                      CASH FLOW STATEMENT
                                      <span className="text-xs text-slate-500 dark:text-gray-400 font-normal ml-auto">Cash Generation</span>
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      {financial.financials.cash_flow_statement.net_cash_flow_from_operating_activities && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">OPERATING CASH FLOW</div>
                                          <div className={`text-sm font-bold font-mono ${
                                            financial.financials.cash_flow_statement.net_cash_flow_from_operating_activities.value >= 0 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {formatCurrency(financial.financials.cash_flow_statement.net_cash_flow_from_operating_activities.value)}
                                          </div>
                                        </div>
                                      )}
                                      {financial.financials.cash_flow_statement.net_cash_flow && (
                                        <div className="bg-white dark:bg-gray-900 p-3 rounded border border-slate-200 dark:border-gray-600">
                                          <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET CASH FLOW</div>
                                          <div className={`text-sm font-bold font-mono ${
                                            financial.financials.cash_flow_statement.net_cash_flow.value >= 0 
                                              ? 'text-green-600 dark:text-green-400' 
                                              : 'text-red-600 dark:text-red-400'
                                          }`}>
                                            {formatCurrency(financial.financials.cash_flow_statement.net_cash_flow.value)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'news' && newsData && (
                <div className="space-y-3">
                  {(newsData.data as PolygonNews[]).map((article) => (
                    <div key={article.id} className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded p-4 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
                            {article.publisher.name}
                          </span>
                          {article.tickers && article.tickers.length > 0 && (
                            <div className="flex gap-1">
                              {article.tickers.map((tick, i) => (
                                <span key={i} className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-mono rounded">
                                  {tick}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-slate-500 dark:text-gray-400 text-xs font-mono">
                          {formatDate(article.published_utc)}
                        </span>
                      </div>
                      
                      <h4 className="text-slate-800 dark:text-white font-medium text-sm mb-2 leading-tight">
                        <a 
                          href={article.article_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h4>
                      
                      {article.description && (
                        <p className="text-slate-600 dark:text-gray-400 text-xs leading-relaxed">
                          {article.description}
                        </p>
                      )}
                      
                      {article.author && (
                        <div className="mt-2 text-slate-500 dark:text-gray-500 text-xs font-mono">
                          BY: {article.author}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !overviewData && !priceData && !financialData && !newsData && !error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
                [ READY_FOR_SEARCH ]
              </div>
              <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
                Enter a ticker symbol to analyze company data
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}