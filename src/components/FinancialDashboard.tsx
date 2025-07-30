'use client';

import { useState, useEffect } from 'react';
import { FinancialSummary, BudgetCategory, BudgetTransaction, Asset, Liability, PortfolioHolding, CreditCard, DebtAccount } from '../lib/types';

export default function FinancialDashboard() {
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyNetIncome: 0,
    savingsRate: 0,
    debtToIncomeRatio: 0,
    creditUtilization: 0,
    emergencyFundMonths: 0
  });

  const [selectedPeriod, setSelectedPeriod] = useState('current');

  useEffect(() => {
    calculateFinancialSummary();
  }, []);

  const calculateFinancialSummary = () => {
    // Get data from localStorage
    const assets: Asset[] = JSON.parse(localStorage.getItem('networth_assets') || '[]');
    const liabilities: Liability[] = JSON.parse(localStorage.getItem('networth_liabilities') || '[]');
    const portfolio: PortfolioHolding[] = JSON.parse(localStorage.getItem('portfolio_holdings') || '[]');
    const creditCards: CreditCard[] = JSON.parse(localStorage.getItem('credit_cards') || '[]');
    const debtAccounts: DebtAccount[] = JSON.parse(localStorage.getItem('debt_accounts') || '[]');
    const categories: BudgetCategory[] = JSON.parse(localStorage.getItem('budget_categories') || '[]');
    const transactions: BudgetTransaction[] = JSON.parse(localStorage.getItem('budget_transactions') || '[]');

    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const portfolioValue = portfolio.reduce((sum, holding) => sum + (holding.currentPrice * holding.quantity), 0);
    const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
    const creditCardDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
    const otherDebt = debtAccounts.reduce((sum, debt) => sum + debt.balance, 0);

    const allAssets = totalAssets + portfolioValue;
    const allLiabilities = totalLiabilities + creditCardDebt + otherDebt;
    const netWorth = allAssets - allLiabilities;

    // Calculate monthly income and expenses
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyNetIncome = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlyNetIncome / monthlyIncome) * 100 : 0;

    // Calculate debt ratios
    const debtToIncomeRatio = monthlyIncome > 0 ? (allLiabilities / (monthlyIncome * 12)) * 100 : 0;
    
    const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
    const creditUtilization = totalCreditLimit > 0 ? (creditCardDebt / totalCreditLimit) * 100 : 0;

    // Calculate emergency fund (months of expenses)
    const cashAssets = assets.filter(asset => asset.type === 'cash').reduce((sum, asset) => sum + asset.value, 0);
    const emergencyFundMonths = monthlyExpenses > 0 ? cashAssets / monthlyExpenses : 0;

    setFinancialSummary({
      totalAssets: allAssets,
      totalLiabilities: allLiabilities,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyNetIncome,
      savingsRate,
      debtToIncomeRatio,
      creditUtilization,
      emergencyFundMonths
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getHealthScore = () => {
    let score = 100;
    
    // Deduct points for high debt-to-income ratio
    if (financialSummary.debtToIncomeRatio > 40) score -= 30;
    else if (financialSummary.debtToIncomeRatio > 20) score -= 15;
    
    // Deduct points for high credit utilization
    if (financialSummary.creditUtilization > 70) score -= 25;
    else if (financialSummary.creditUtilization > 30) score -= 15;
    
    // Deduct points for low savings rate
    if (financialSummary.savingsRate < 10) score -= 20;
    else if (financialSummary.savingsRate < 20) score -= 10;
    
    // Deduct points for insufficient emergency fund
    if (financialSummary.emergencyFundMonths < 3) score -= 15;
    else if (financialSummary.emergencyFundMonths < 6) score -= 5;
    
    return Math.max(0, score);
  };

  const getHealthGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { grade: 'F', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const healthScore = getHealthScore();
  const healthGrade = getHealthGrade(healthScore);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
            FINANCIAL_DASHBOARD
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="current">CURRENT MONTH</option>
              <option value="ytd">YEAR TO DATE</option>
              <option value="all">ALL TIME</option>
            </select>
            <button
              onClick={calculateFinancialSummary}
              className="px-4 py-2 font-mono text-sm border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              <span>⟳</span> REFRESH
            </button>
          </div>
        </div>

        {/* Financial Health Score */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
            FINANCIAL_HEALTH_SCORE
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full ${healthGrade.bg} flex items-center justify-center`}>
                <span className={`text-2xl font-bold font-mono ${healthGrade.color}`}>
                  {healthGrade.grade}
                </span>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-slate-800 dark:text-white">
                  {healthScore}/100
                </div>
                <div className="text-sm font-mono text-slate-600 dark:text-gray-400">
                  Overall Financial Health
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">EMERGENCY FUND</div>
                  <div className={`font-mono ${
                    financialSummary.emergencyFundMonths >= 6 
                      ? 'text-green-600 dark:text-green-400' 
                      : financialSummary.emergencyFundMonths >= 3
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {financialSummary.emergencyFundMonths.toFixed(1)} months
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">SAVINGS RATE</div>
                  <div className={`font-mono ${
                    financialSummary.savingsRate >= 20 
                      ? 'text-green-600 dark:text-green-400' 
                      : financialSummary.savingsRate >= 10
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercent(financialSummary.savingsRate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET WORTH</div>
            <div className={`text-2xl font-bold font-mono ${
              financialSummary.netWorth >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(financialSummary.netWorth)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY INCOME</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {formatCurrency(financialSummary.monthlyIncome)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY EXPENSES</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(financialSummary.monthlyExpenses)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET MONTHLY</div>
            <div className={`text-2xl font-bold font-mono ${
              financialSummary.monthlyNetIncome >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(financialSummary.monthlyNetIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset vs Liability Breakdown */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            ASSETS_VS_LIABILITIES
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-slate-600 dark:text-gray-400">Total Assets:</span>
              <span className="font-mono text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(financialSummary.totalAssets)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-slate-600 dark:text-gray-400">Total Liabilities:</span>
              <span className="font-mono text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency(financialSummary.totalLiabilities)}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">Net Worth:</span>
                <span className={`font-mono text-xl font-bold ${
                  financialSummary.netWorth >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(financialSummary.netWorth)}
                </span>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="mt-4">
              <div className="text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">ASSET COMPOSITION</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full flex items-center justify-center text-white text-xs font-mono"
                  style={{ 
                    width: financialSummary.totalAssets > 0 
                      ? `${Math.min(100, (financialSummary.totalAssets / (financialSummary.totalAssets + financialSummary.totalLiabilities)) * 100)}%`
                      : '0%'
                  }}
                >
                  ASSETS
                </div>
              </div>
              {financialSummary.totalLiabilities > 0 && (
                <div className="w-full bg-red-500 rounded-full h-4 mt-1 flex items-center justify-center text-white text-xs font-mono">
                  LIABILITIES
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Indicators */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            RISK_INDICATORS
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm text-slate-600 dark:text-gray-400">Debt-to-Income Ratio:</span>
                <span className={`font-mono text-sm font-bold ${
                  financialSummary.debtToIncomeRatio <= 20 
                    ? 'text-green-600 dark:text-green-400' 
                    : financialSummary.debtToIncomeRatio <= 40
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercent(financialSummary.debtToIncomeRatio)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    financialSummary.debtToIncomeRatio <= 20 
                      ? 'bg-green-500' 
                      : financialSummary.debtToIncomeRatio <= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, financialSummary.debtToIncomeRatio)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-sm text-slate-600 dark:text-gray-400">Credit Utilization:</span>
                <span className={`font-mono text-sm font-bold ${
                  financialSummary.creditUtilization <= 30 
                    ? 'text-green-600 dark:text-green-400' 
                    : financialSummary.creditUtilization <= 70
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercent(financialSummary.creditUtilization)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    financialSummary.creditUtilization <= 30 
                      ? 'bg-green-500' 
                      : financialSummary.creditUtilization <= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, financialSummary.creditUtilization)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
              <div className="text-xs font-mono text-slate-500 dark:text-gray-400 mb-2">RECOMMENDATIONS</div>
              <div className="space-y-2 text-xs font-mono">
                {financialSummary.emergencyFundMonths < 6 && (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    • Build emergency fund to 6 months expenses
                  </div>
                )}
                {financialSummary.savingsRate < 20 && (
                  <div className="text-yellow-600 dark:text-yellow-400">
                    • Increase savings rate to 20%+
                  </div>
                )}
                {financialSummary.creditUtilization > 30 && (
                  <div className="text-red-600 dark:text-red-400">
                    • Reduce credit utilization below 30%
                  </div>
                )}
                {financialSummary.debtToIncomeRatio > 40 && (
                  <div className="text-red-600 dark:text-red-400">
                    • Consider debt consolidation or payoff strategy
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}