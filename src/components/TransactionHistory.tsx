'use client';

import { useState, useEffect } from 'react';
import { Transaction, SpendingAnalytics } from '../lib/types';
import { TransactionManager } from '../lib/transactions';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
    calculateAnalytics();
  }, [transactions, selectedCategory, selectedType, selectedPeriod, searchTerm]);

  const loadTransactions = () => {
    const allTransactions = TransactionManager.getTransactions();
    setTransactions(allTransactions);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.relatedName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.metadata?.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const calculateAnalytics = () => {
    if (filteredTransactions.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalSpent = filteredTransactions
      .filter(t => t.type !== 'dividend')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categoryBreakdown: { [category: string]: number } = {};
    const monthlyTrends: { [month: string]: number } = {};

    filteredTransactions.forEach(transaction => {
      // Category breakdown
      if (!categoryBreakdown[transaction.category]) {
        categoryBreakdown[transaction.category] = 0;
      }
      categoryBreakdown[transaction.category] += Math.abs(transaction.amount);

      // Monthly trends
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7);
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = 0;
      }
      monthlyTrends[monthKey] += Math.abs(transaction.amount);
    });

    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const monthlyValues = Object.values(monthlyTrends);
    const averageMonthlySpending = monthlyValues.length > 0 
      ? monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length 
      : 0;

    // Calculate spending growth (current month vs previous month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
    const currentMonthSpending = monthlyTrends[currentMonth] || 0;
    const previousMonthSpending = monthlyTrends[previousMonth] || 0;
    const spendingGrowth = previousMonthSpending > 0 
      ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100 
      : 0;

    setAnalytics({
      totalSpent,
      categoryBreakdown,
      monthlyTrends,
      averageMonthlySpending,
      topCategories,
      spendingGrowth
    });
  };

  const deleteTransaction = (id: string) => {
    TransactionManager.removeTransaction(id);
    loadTransactions();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    const icons = {
      buy: '📈',
      sell: '📉',
      dividend: '💰',
      bill_payment: '📋',
      goal_contribution: '🎯',
      budget_transaction: '💳',
      debt_payment: '💸',
      credit_payment: '💎',
      transfer: '🔄',
      fee: '⚡'
    };
    return icons[type] || '💼';
  };

  const getCategoryColor = (category: Transaction['category']) => {
    const colors = {
      portfolio: '#10B981',
      budget: '#3B82F6',
      goals: '#8B5CF6',
      bills: '#F59E0B',
      debt: '#EF4444',
      credit: '#EC4899',
      transfer: '#6B7280'
    };
    return colors[category] || '#6B7280';
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Transaction History Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-violet-500 rounded-full"></span>
            TRANSACTION_HISTORY_&_ANALYTICS
          </h2>
          <button
            onClick={loadTransactions}
            className="px-4 py-2 font-mono text-sm border border-violet-500 text-violet-400 hover:bg-violet-500/10 transition-all"
          >
            <span>⟳</span> REFRESH
          </button>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL ACTIVITY</div>
              <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">
                {formatCurrency(analytics.totalSpent)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AVG MONTHLY</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
                {formatCurrency(analytics.averageMonthlySpending)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TRANSACTIONS</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                {filteredTransactions.length}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY GROWTH</div>
              <div className={`text-2xl font-bold font-mono ${
                analytics.spendingGrowth >= 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {analytics.spendingGrowth >= 0 ? '+' : ''}{analytics.spendingGrowth.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-violet-400"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-violet-400"
          >
            <option value="all">ALL CATEGORIES</option>
            <option value="portfolio">PORTFOLIO</option>
            <option value="budget">BUDGET</option>
            <option value="goals">GOALS</option>
            <option value="bills">BILLS</option>
            <option value="debt">DEBT</option>
            <option value="credit">CREDIT</option>
            <option value="transfer">TRANSFER</option>
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-violet-400"
          >
            <option value="all">ALL TYPES</option>
            <option value="buy">BUY</option>
            <option value="sell">SELL</option>
            <option value="dividend">DIVIDEND</option>
            <option value="bill_payment">BILL PAYMENT</option>
            <option value="goal_contribution">GOAL CONTRIBUTION</option>
            <option value="budget_transaction">BUDGET TRANSACTION</option>
            <option value="debt_payment">DEBT PAYMENT</option>
            <option value="credit_payment">CREDIT PAYMENT</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-violet-400"
          >
            <option value="all">ALL TIME</option>
            <option value="week">PAST WEEK</option>
            <option value="month">PAST MONTH</option>
            <option value="quarter">PAST QUARTER</option>
            <option value="year">PAST YEAR</option>
          </select>
        </div>
      </div>

      {/* Top Categories Analytics */}
      {analytics && analytics.topCategories.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
            TOP_CATEGORIES
          </h3>
          <div className="space-y-3">
            {analytics.topCategories.map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-mono ${
                    index === 0 ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' : 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCategoryColor(cat.category as Transaction['category']) }}
                  ></div>
                  <span className="font-mono text-sm text-slate-800 dark:text-white uppercase">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-slate-800 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-gray-400">
                    {cat.percentage.toFixed(1)}%
                  </span>
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 bg-violet-500 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
            TRANSACTION_LIST [{filteredTransactions.length}]
          </h3>
        </div>

        {currentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
              [ NO_TRANSACTIONS_FOUND ]
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
              {searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedPeriod !== 'all'
                ? 'Try adjusting your filters'
                : 'Start using the financial hub to see transaction history'
              }
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200 dark:divide-gray-700">
              {currentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {getTransactionIcon(transaction.type)}
                      </span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(transaction.category) }}
                      ></div>
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                          {transaction.description}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2 py-1 text-xs font-mono rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 uppercase">
                            {transaction.category}
                          </span>
                          <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase">
                            {transaction.type.replace('_', ' ')}
                          </span>
                          {transaction.metadata?.symbol && (
                            <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              {transaction.metadata.symbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`font-mono text-lg font-bold ${
                          transaction.type === 'dividend' || transaction.type === 'sell'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-800 dark:text-white'
                        }`}>
                          {transaction.type === 'dividend' || transaction.type === 'sell' ? '+' : ''}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-gray-400">
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this transaction?')) {
                            deleteTransaction(transaction.id);
                          }
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                  
                  {transaction.metadata && (
                    <div className="mt-2 ml-12 text-xs font-mono text-slate-500 dark:text-gray-400">
                      {transaction.metadata.quantity && transaction.metadata.price && (
                        <span>Qty: {transaction.metadata.quantity} @ {formatCurrency(transaction.metadata.price)}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-mono text-slate-600 dark:text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 font-mono text-sm border transition-all ${
                      currentPage === 1
                        ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                        : 'border-violet-500 text-violet-400 hover:bg-violet-500/10'
                    }`}
                  >
                    PREV
                  </button>
                  <span className="px-3 py-1 font-mono text-sm text-slate-600 dark:text-gray-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 font-mono text-sm border transition-all ${
                      currentPage === totalPages
                        ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                        : 'border-violet-500 text-violet-400 hover:bg-violet-500/10'
                    }`}
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}