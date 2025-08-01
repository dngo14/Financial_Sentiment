'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';

interface OverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  category?: string;
  date?: string;
}

const COLORS = {
  portfolio: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
  budget: ['#059669', '#DC2626', '#D97706', '#7C2D12', '#374151'],
  debt: ['#DC2626', '#F59E0B', '#10B981', '#6B7280'],
  goals: ['#10B981', '#F59E0B', '#6B7280']
};

export default function FinancialOverviewModal({ isOpen, onClose, data }: OverviewModalProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'budget' | 'goals' | 'debt' | 'transactions'>('portfolio');

  if (!isOpen) return null;

  // Portfolio Data Processing
  const portfolioData = data?.portfolio?.map((item: any, index: number) => ({
    name: item.symbol || item.name,
    value: item.value || item.currentValue || 0,
    color: COLORS.portfolio[index % COLORS.portfolio.length]
  })) || [];

  const totalPortfolioValue = portfolioData.reduce((sum: number, item: ChartData) => sum + item.value, 0);

  // Budget Data Processing
  const budgetData = data?.categories?.map((cat: any, index: number) => ({
    name: cat.name,
    budget: cat.budget || 0,
    spent: cat.spent || 0,
    remaining: Math.max(0, (cat.budget || 0) - (cat.spent || 0)),
    color: COLORS.budget[index % COLORS.budget.length]
  })) || [];

  // Goals Data Processing
  const goalsData = data?.goals?.map((goal: any) => ({
    name: goal.name,
    target: goal.targetAmount || 0,
    current: goal.currentAmount || 0,
    progress: goal.targetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  })) || [];

  // Debt Data Processing  
  const debtData = data?.debts?.map((debt: any, index: number) => ({
    name: debt.name || debt.type,
    balance: debt.balance || 0,
    interestRate: debt.interestRate || 0,
    minPayment: debt.minPayment || 0,
    color: COLORS.debt[index % COLORS.debt.length]
  })) || [];

  // Transaction Trends (last 6 months)
  const transactionTrends = [
    { month: 'Jan', income: 5000, expenses: 3200, savings: 1800 },
    { month: 'Feb', income: 5200, expenses: 3100, savings: 2100 },
    { month: 'Mar', income: 4800, expenses: 3400, savings: 1400 },
    { month: 'Apr', income: 5100, expenses: 3300, savings: 1800 },
    { month: 'May', income: 5300, expenses: 3500, savings: 1800 },
    { month: 'Jun', income: 5000, expenses: 3200, savings: 1800 }
  ];

  // Net Worth Trend
  const netWorthTrend = [
    { month: 'Jan', assets: 45000, liabilities: 25000, netWorth: 20000 },
    { month: 'Feb', assets: 47000, liabilities: 24500, netWorth: 22500 },
    { month: 'Mar', assets: 46000, liabilities: 24000, netWorth: 22000 },
    { month: 'Apr', assets: 48500, liabilities: 23500, netWorth: 25000 },
    { month: 'May', assets: 50000, liabilities: 23000, netWorth: 27000 },
    { month: 'Jun', assets: 52000, liabilities: 22500, netWorth: 29500 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded shadow-lg font-mono text-xs">
          <p className="text-gray-900 dark:text-white font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-white">
              FINANCIAL_OVERVIEW_DASHBOARD
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-mono text-lg"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {[
            { key: 'portfolio', label: 'PORTFOLIO', icon: '📊' },
            { key: 'budget', label: 'BUDGET', icon: '💰' },
            { key: 'goals', label: 'GOALS', icon: '🎯' },
            { key: 'debt', label: 'DEBT', icon: '💳' },
            { key: 'transactions', label: 'TRENDS', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-mono text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Allocation Pie Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> PORTFOLIO_ALLOCATION
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Portfolio Performance */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📈</span> NET_WORTH_TREND
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={netWorthTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="netWorth" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="assets" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Portfolio Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                    ${totalPortfolioValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-mono">TOTAL_VALUE</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {portfolioData.length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">HOLDINGS</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    ${(data?.cash || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">CASH</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                    +8.5%
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-mono">YTD_RETURN</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget vs Actual */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>💰</span> BUDGET_VS_ACTUAL
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="budget" fill="#10B981" name="Budget" />
                      <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Income vs Expenses Trend */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> INCOME_VS_EXPENSES
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={transactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} />
                      <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} />
                      <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                    ${(data?.monthlyIncome || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-mono">MONTHLY_INCOME</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                    ${(data?.monthlyExpenses || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-mono">MONTHLY_EXPENSES</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {((data?.savingsRate || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">SAVINGS_RATE</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {budgetData.length}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">CATEGORIES</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals Progress */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🎯</span> GOALS_PROGRESS
                  </h3>
                  <div className="space-y-4">
                    {goalsData.map((goal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{goal.name}</span>
                          <span className="text-sm font-mono text-gray-500">{goal.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(goal.progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-gray-500">
                          <span>${goal.current.toLocaleString()}</span>
                          <span>${goal.target.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals Radial Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> COMPLETION_OVERVIEW
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={goalsData}>
                      <RadialBar
                        dataKey="progress"
                        cornerRadius={10}
                        fill="#8884d8"
                      />
                      <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Progress']} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Goals Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                    {goalsData.filter(g => g.progress >= 100).length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-mono">COMPLETED</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {goalsData.filter(g => g.progress < 100 && g.progress > 0).length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">IN_PROGRESS</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                    ${goalsData.reduce((sum, g) => sum + g.target, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-mono">TOTAL_TARGET</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {goalsData.length > 0 ? (goalsData.reduce((sum, g) => sum + g.progress, 0) / goalsData.length).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">AVG_PROGRESS</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'debt' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Debt Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>💳</span> DEBT_BREAKDOWN
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={debtData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="balance"
                      >
                        {debtData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Balance']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Interest Rates */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📊</span> INTEREST_RATES
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={debtData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Interest Rate']} />
                      <Bar dataKey="interestRate" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Debt Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                    ${debtData.reduce((sum, debt) => sum + debt.balance, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-mono">TOTAL_DEBT</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                    ${debtData.reduce((sum, debt) => sum + debt.minPayment, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 font-mono">MIN_PAYMENTS</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {debtData.length > 0 ? (debtData.reduce((sum, debt) => sum + debt.interestRate, 0) / debtData.length).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">AVG_INTEREST</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {debtData.filter(d => d.interestRate > 15).length}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">HIGH_INTEREST</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow Trend */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>📈</span> CASH_FLOW_TREND
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={transactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Savings Rate Trend */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h3 className="text-lg font-mono font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>💰</span> SAVINGS_TREND
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={transactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="savings" stroke="#3B82F6" strokeWidth={4} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
                    ${transactionTrends[transactionTrends.length - 1]?.income.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 font-mono">LAST_MONTH_INCOME</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                    ${transactionTrends[transactionTrends.length - 1]?.expenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-mono">LAST_MONTH_EXPENSES</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                    ${transactionTrends[transactionTrends.length - 1]?.savings.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-mono">LAST_MONTH_SAVINGS</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {transactionTrends.reduce((sum, month) => sum + month.savings, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">6M_TOTAL_SAVINGS</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-xs font-mono text-gray-500 dark:text-gray-400">
            <span>Financial Overview Dashboard - Real-time Data Visualization</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}