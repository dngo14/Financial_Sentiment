import { PortfolioHolding, OptionPosition, Transaction, PortfolioAnalytics } from './types';
import { TransactionManager } from './transactions';

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageGain: number;
  averageLoss: number;
  profitFactor: number;
  currentDrawdown: number;
}

export interface PortfolioComposition {
  bySymbol: { symbol: string; value: number; percentage: number; type: 'stock' | 'option' }[];
  bySector: { sector: string; value: number; percentage: number }[];
  byAssetType: { stocks: number; options: number; cash: number };
  concentration: { largestPosition: number; top5Concentration: number };
}

export interface PerformanceTimeline {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

export interface RiskMetrics {
  beta: number;
  correlation: number;
  valueAtRisk: number; // 95% VaR
  conditionalVaR: number; // Expected shortfall
  riskAdjustedReturn: number;
  downsideDeviation: number;
  sortinoRatio: number;
}

export interface HoldingAnalysis {
  symbol: string;
  type: 'stock' | 'option';
  currentValue: number;
  costBasis: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  realizedGainLoss: number;
  totalGainLoss: number;
  holdingPeriod: number; // days
  weightInPortfolio: number;
  contribution: number; // contribution to total return
  averageCost: number;
  totalShares: number;
}

class PortfolioAnalyticsEngine {
  private static instance: PortfolioAnalyticsEngine;
  
  static getInstance(): PortfolioAnalyticsEngine {
    if (!PortfolioAnalyticsEngine.instance) {
      PortfolioAnalyticsEngine.instance = new PortfolioAnalyticsEngine();
    }
    return PortfolioAnalyticsEngine.instance;
  }

  // Calculate comprehensive performance metrics
  calculatePerformanceMetrics(
    holdings: PortfolioHolding[],
    options: OptionPosition[],
    transactions: Transaction[]
  ): PerformanceMetrics {
    const timeline = this.buildPerformanceTimeline(holdings, options, transactions);
    
    if (timeline.length < 2) {
      return this.getEmptyMetrics();
    }

    const returns = timeline.slice(1).map(point => point.dailyReturn);
    const cumulativeReturns = timeline.map(point => point.cumulativeReturn);
    
    const totalReturn = cumulativeReturns[cumulativeReturns.length - 1];
    const totalReturnPercent = totalReturn * 100;
    
    // Annualized return
    const daysInvested = timeline.length;
    const annualizedReturn = daysInvested > 0 
      ? (Math.pow(1 + totalReturn, 365 / daysInvested) - 1) * 100
      : 0;
    
    // Volatility (annualized standard deviation)
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 365) * 100;
    
    // Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const excessReturn = (annualizedReturn / 100) - riskFreeRate;
    const sharpeRatio = volatility > 0 ? excessReturn / (volatility / 100) : 0;
    
    // Max drawdown
    const maxDrawdown = Math.min(...timeline.map(point => point.drawdown)) * 100;
    const currentDrawdown = timeline[timeline.length - 1]?.drawdown * 100 || 0;
    
    // Win/loss analysis
    const wins = returns.filter(ret => ret > 0);
    const losses = returns.filter(ret => ret < 0);
    const winRate = returns.length > 0 ? (wins.length / returns.length) * 100 : 0;
    const averageGain = wins.length > 0 ? (wins.reduce((sum, win) => sum + win, 0) / wins.length) * 100 : 0;
    const averageLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, loss) => sum + loss, 0) / losses.length) * 100 : 0;
    const profitFactor = averageLoss > 0 ? (averageGain * wins.length) / (averageLoss * losses.length) : 0;

    return {
      totalReturn: totalReturn * 100,
      totalReturnPercent,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
      averageGain,
      averageLoss,
      profitFactor,
      currentDrawdown
    };
  }

  // Analyze individual holdings performance
  analyzeHoldings(
    holdings: PortfolioHolding[],
    options: OptionPosition[],
    transactions: Transaction[]
  ): HoldingAnalysis[] {
    const analysis: HoldingAnalysis[] = [];
    const totalPortfolioValue = this.calculateTotalPortfolioValue(holdings, options);

    // Analyze stocks
    holdings.forEach(holding => {
      const holdingTransactions = transactions.filter(t => 
        t.metadata?.symbol === holding.symbol && (t.type === 'buy' || t.type === 'sell')
      );

      const costBasis = holding.quantity * holding.purchasePrice;
      const currentValue = holding.quantity * holding.currentPrice;
      const unrealizedGainLoss = currentValue - costBasis;
      const unrealizedGainLossPercent = costBasis > 0 ? (unrealizedGainLoss / costBasis) * 100 : 0;

      // Calculate realized gains from sell transactions
      const realizedGainLoss = holdingTransactions
        .filter(t => t.type === 'sell')
        .reduce((sum, t) => sum + (t.amount - (t.metadata?.quantity || 0) * holding.purchasePrice), 0);

      const holdingPeriod = Math.floor(
        (new Date().getTime() - new Date(holding.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      analysis.push({
        symbol: holding.symbol,
        type: 'stock',
        currentValue,
        costBasis,
        unrealizedGainLoss,
        unrealizedGainLossPercent,
        realizedGainLoss,
        totalGainLoss: unrealizedGainLoss + realizedGainLoss,
        holdingPeriod,
        weightInPortfolio: totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0,
        contribution: totalPortfolioValue > 0 ? (unrealizedGainLoss / totalPortfolioValue) * 100 : 0,
        averageCost: holding.purchasePrice,
        totalShares: holding.quantity
      });
    });

    // Analyze options
    options.forEach(option => {
      const costBasis = option.totalPremium;
      const currentValue = option.currentPrice * option.quantity * 100;
      const unrealizedGainLoss = currentValue - costBasis;
      const unrealizedGainLossPercent = costBasis > 0 ? (unrealizedGainLoss / costBasis) * 100 : 0;

      const holdingPeriod = Math.floor(
        (new Date().getTime() - new Date(option.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      analysis.push({
        symbol: option.contractSymbol,
        type: 'option',
        currentValue,
        costBasis,
        unrealizedGainLoss,
        unrealizedGainLossPercent,
        realizedGainLoss: 0, // Options typically closed, not partially sold
        totalGainLoss: unrealizedGainLoss,
        holdingPeriod,
        weightInPortfolio: totalPortfolioValue > 0 ? (currentValue / totalPortfolioValue) * 100 : 0,
        contribution: totalPortfolioValue > 0 ? (unrealizedGainLoss / totalPortfolioValue) * 100 : 0,
        averageCost: option.premium,
        totalShares: option.quantity
      });
    });

    return analysis.sort((a, b) => b.currentValue - a.currentValue);
  }

  // Build portfolio composition analysis
  analyzeComposition(holdings: PortfolioHolding[], options: OptionPosition[]): PortfolioComposition {
    const totalValue = this.calculateTotalPortfolioValue(holdings, options);
    
    // By symbol
    const bySymbol: { symbol: string; value: number; percentage: number; type: 'stock' | 'option' }[] = [];
    
    holdings.forEach(holding => {
      const value = holding.quantity * holding.currentPrice;
      bySymbol.push({
        symbol: holding.symbol,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        type: 'stock'
      });
    });

    options.forEach(option => {
      const value = option.currentPrice * option.quantity * 100;
      bySymbol.push({
        symbol: option.symbol,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        type: 'option'
      });
    });

    bySymbol.sort((a, b) => b.value - a.value);

    // By asset type
    const stocksValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const optionsValue = options.reduce((sum, o) => sum + (o.currentPrice * o.quantity * 100), 0);
    
    const byAssetType = {
      stocks: totalValue > 0 ? (stocksValue / totalValue) * 100 : 0,
      options: totalValue > 0 ? (optionsValue / totalValue) * 100 : 0,
      cash: 0 // Could be enhanced to track cash positions
    };

    // Concentration metrics
    const largestPosition = bySymbol.length > 0 ? bySymbol[0].percentage : 0;
    const top5Concentration = bySymbol.slice(0, 5).reduce((sum, pos) => sum + pos.percentage, 0);

    // Basic sector allocation (simplified - could be enhanced with actual sector mapping)
    const bySector = this.estimateSectorAllocation(bySymbol);

    return {
      bySymbol,
      bySector,
      byAssetType,
      concentration: {
        largestPosition,
        top5Concentration
      }
    };
  }

  // Build performance timeline from transactions
  private buildPerformanceTimeline(
    holdings: PortfolioHolding[],
    options: OptionPosition[],
    transactions: Transaction[]
  ): PerformanceTimeline[] {
    const timeline: PerformanceTimeline[] = [];
    
    // Start from earliest transaction date
    if (transactions.length === 0) return timeline;
    
    const startDate = new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())));
    const endDate = new Date();
    
    let previousValue = 0;
    let peakValue = 0;
    
    // Generate daily timeline (simplified - could use actual daily prices)
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate portfolio value at this date (simplified)
      const portfolioValue = this.calculateTotalPortfolioValue(holdings, options);
      
      if (timeline.length === 0) {
        previousValue = portfolioValue;
        peakValue = portfolioValue;
      }
      
      const dailyReturn = previousValue > 0 ? (portfolioValue - previousValue) / previousValue : 0;
      const cumulativeReturn = timeline.length > 0 
        ? ((portfolioValue / (timeline[0].portfolioValue || 1)) - 1)
        : 0;
      
      peakValue = Math.max(peakValue, portfolioValue);
      const drawdown = peakValue > 0 ? (portfolioValue - peakValue) / peakValue : 0;
      
      timeline.push({
        date: dateStr,
        portfolioValue,
        dailyReturn,
        cumulativeReturn,
        drawdown
      });
      
      previousValue = portfolioValue;
    }
    
    return timeline;
  }

  private calculateTotalPortfolioValue(holdings: PortfolioHolding[], options: OptionPosition[]): number {
    const stocksValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const optionsValue = options.reduce((sum, o) => sum + (o.currentPrice * o.quantity * 100), 0);
    return stocksValue + optionsValue;
  }

  private estimateSectorAllocation(positions: { symbol: string; value: number; percentage: number }[]): { sector: string; value: number; percentage: number }[] {
    // Simplified sector mapping - could be enhanced with real sector data
    const sectorMap: { [key: string]: string } = {
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'AMZN': 'Consumer Discretionary',
      'TSLA': 'Consumer Discretionary',
      'NVDA': 'Technology',
      'META': 'Technology',
      'JPM': 'Financial Services',
      'JNJ': 'Healthcare',
      'PG': 'Consumer Staples'
    };

    const sectorTotals: { [sector: string]: number } = {};
    let totalValue = 0;

    positions.forEach(pos => {
      const sector = sectorMap[pos.symbol] || 'Other';
      sectorTotals[sector] = (sectorTotals[sector] || 0) + pos.value;
      totalValue += pos.value;
    });

    return Object.entries(sectorTotals)
      .map(([sector, value]) => ({
        sector,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      averageGain: 0,
      averageLoss: 0,
      profitFactor: 0,
      currentDrawdown: 0
    };
  }
}

export const portfolioAnalytics = PortfolioAnalyticsEngine.getInstance();