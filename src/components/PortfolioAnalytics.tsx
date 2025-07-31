'use client';

import { useState, useEffect } from 'react';
import { PortfolioHolding, OptionPosition, Transaction } from '../lib/types';
import { portfolioAnalytics, PerformanceMetrics, PortfolioComposition, HoldingAnalysis } from '../lib/portfolioAnalytics';
import { TransactionManager } from '../lib/transactions';

export default function PortfolioAnalytics() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [options, setOptions] = useState<OptionPosition[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [composition, setComposition] = useState<PortfolioComposition | null>(null);
  const [holdingAnalysis, setHoldingAnalysis] = useState<HoldingAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'holdings' | 'composition' | 'risk'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    // Load portfolio data
    const savedHoldings = localStorage.getItem('portfolio_holdings');
    const savedOptions = localStorage.getItem('portfolio_options');
    const allTransactions = TransactionManager.getTransactions();

    const holdingsData = savedHoldings ? JSON.parse(savedHoldings) : [];
    const optionsData = savedOptions ? JSON.parse(savedOptions) : [];

    setHoldings(holdingsData);
    setOptions(optionsData);
    setTransactions(allTransactions);

    // Calculate analytics
    const performanceMetrics = portfolioAnalytics.calculatePerformanceMetrics(
      holdingsData,
      optionsData,
      allTransactions
    );

    const compositionAnalysis = portfolioAnalytics.analyzeComposition(
      holdingsData,
      optionsData
    );

    const holdingsAnalysis = portfolioAnalytics.analyzeHoldings(
      holdingsData,
      optionsData,
      allTransactions
    );

    setMetrics(performanceMetrics);
    setComposition(compositionAnalysis);
    setHoldingAnalysis(holdingsAnalysis);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number, decimals: number = 2) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  };

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600 dark:text-gray-400 font-mono">
          CALCULATING_ANALYTICS...
        </div>
      </div>
    );
  }

  if (!metrics || !composition) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            PORTFOLIO_ANALYTICS_ENGINE
          </h2>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
              [ NO_PORTFOLIO_DATA_FOUND ]
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-sm mb-4">
              Add stocks or options to your portfolio to see comprehensive performance analytics
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-xs">
              Analytics include: Performance metrics, Risk analysis, Holdings breakdown, Sector allocation, and more
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            PORTFOLIO_ANALYTICS_ENGINE
          </h2>
          <button
            onClick={loadData}
            className="px-4 py-2 font-mono text-sm border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            <span>⟳</span> REFRESH
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'overview', label: 'OVERVIEW', icon: '📊' },
            { id: 'holdings', label: 'HOLDINGS', icon: '📈' },
            { id: 'composition', label: 'COMPOSITION', icon: '🥧' },
            { id: 'risk', label: 'RISK', icon: '⚠️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-mono text-sm border transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Performance Metrics */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              PERFORMANCE_METRICS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL RETURN</div>
                <div className={`text-2xl font-bold font-mono ${getPerformanceColor(metrics.totalReturn)}`}>
                  {formatPercent(metrics.totalReturn)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  Annualized: {formatPercent(metrics.annualizedReturn)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">SHARPE RATIO</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.sharpeRatio > 1 ? 'text-green-600 dark:text-green-400' :
                  metrics.sharpeRatio > 0 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.sharpeRatio.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  Risk-Adjusted Return
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">VOLATILITY</div>
                <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                  {formatPercent(metrics.volatility)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  Annualized Std Dev
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MAX DRAWDOWN</div>
                <div className={`text-2xl font-bold font-mono ${getPerformanceColor(metrics.maxDrawdown)}`}>
                  {formatPercent(metrics.maxDrawdown)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  Current: {formatPercent(metrics.currentDrawdown)}
                </div>
              </div>
            </div>
          </div>

          {/* Win/Loss Analysis */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              WIN_LOSS_ANALYSIS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">WIN RATE</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.winRate > 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercent(metrics.winRate)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AVG GAIN</div>
                <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                  {formatPercent(metrics.averageGain)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AVG LOSS</div>
                <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">
                  {formatPercent(-metrics.averageLoss)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">PROFIT FACTOR</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.profitFactor > 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {metrics.profitFactor.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holdings Analysis Tab */}
      {activeTab === 'holdings' && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
              HOLDINGS_ANALYSIS [{holdingAnalysis.length}]
            </h3>
          </div>
          
          {holdingAnalysis.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
                [ NO_HOLDINGS_DATA ]
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">SYMBOL</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">TYPE</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">VALUE</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">COST BASIS</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">GAIN/LOSS</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">WEIGHT</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">CONTRIBUTION</th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase">DAYS HELD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {holdingAnalysis.map((holding) => (
                    <tr key={holding.symbol} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-slate-800 dark:text-white">
                        {holding.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-mono rounded-full ${
                          holding.type === 'stock' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>
                          {holding.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                        {formatCurrency(holding.currentValue)}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                        {formatCurrency(holding.costBasis)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-mono text-sm ${getPerformanceColor(holding.unrealizedGainLoss)}`}>
                          {formatCurrency(holding.unrealizedGainLoss)}
                        </div>
                        <div className={`font-mono text-xs ${getPerformanceColor(holding.unrealizedGainLossPercent)}`}>
                          {formatPercent(holding.unrealizedGainLossPercent)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                        {formatPercent(holding.weightInPortfolio)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`font-mono text-sm ${getPerformanceColor(holding.contribution)}`}>
                          {formatPercent(holding.contribution)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                        {holding.holdingPeriod}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Composition Tab */}
      {activeTab === 'composition' && (
        <div className="space-y-6">
          {/* Asset Allocation */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              ASSET_ALLOCATION
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">STOCKS</div>
                <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                  {formatPercent(composition.byAssetType.stocks)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">OPTIONS</div>
                <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
                  {formatPercent(composition.byAssetType.options)}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">CASH</div>
                <div className="text-2xl font-bold font-mono text-green-600 dark:text-green-400">
                  {formatPercent(composition.byAssetType.cash)}
                </div>
              </div>
            </div>
          </div>

          {/* Concentration Risk */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              CONCENTRATION_ANALYSIS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">LARGEST POSITION</div>
                <div className={`text-2xl font-bold font-mono ${
                  composition.concentration.largestPosition > 20 ? 'text-red-600 dark:text-red-400' :
                  composition.concentration.largestPosition > 10 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {formatPercent(composition.concentration.largestPosition)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  {composition.concentration.largestPosition > 20 ? 'High Risk' :
                   composition.concentration.largestPosition > 10 ? 'Medium Risk' : 'Low Risk'}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOP 5 CONCENTRATION</div>
                <div className={`text-2xl font-bold font-mono ${
                  composition.concentration.top5Concentration > 60 ? 'text-red-600 dark:text-red-400' :
                  composition.concentration.top5Concentration > 40 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {formatPercent(composition.concentration.top5Concentration)}
                </div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mt-1">
                  {composition.concentration.top5Concentration > 60 ? 'Over-Concentrated' :
                   composition.concentration.top5Concentration > 40 ? 'Moderately Concentrated' : 'Well Diversified'}
                </div>
              </div>
            </div>
          </div>

          {/* Top Holdings */}
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              TOP_POSITIONS
            </h3>
            <div className="space-y-3">
              {composition.bySymbol.slice(0, 10).map((position, index) => (
                <div key={position.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-mono ${
                      index === 0 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="font-mono text-sm text-slate-800 dark:text-white">
                      {position.symbol}
                    </div>
                    <span className={`px-2 py-1 text-xs font-mono rounded-full ${
                      position.type === 'stock' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    }`}>
                      {position.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-slate-800 dark:text-white">
                      {formatCurrency(position.value)}
                    </span>
                    <span className="font-mono text-sm text-slate-500 dark:text-gray-400">
                      {formatPercent(position.percentage)}
                    </span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, position.percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Tab */}
      {activeTab === 'risk' && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            RISK_ANALYSIS_COMING_SOON
          </h3>
          <div className="text-center py-8">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-sm">
              Advanced risk metrics including Beta, VaR, and correlation analysis will be available in the next update
            </div>
          </div>
        </div>
      )}
    </div>
  );
}