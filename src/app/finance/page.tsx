'use client';

import { useState } from 'react';
import FinancialDashboard from '../../components/FinancialDashboard';
import PortfolioTracker from '../../components/PortfolioTracker';
import BudgetTracker from '../../components/BudgetTracker';
import NetWorthTracker from '../../components/NetWorthTracker';
import DebtTracker from '../../components/DebtTracker';
import CreditCardTracker from '../../components/CreditCardTracker';
import GoalsTracker from '../../components/GoalsTracker';
import BillTracker from '../../components/BillTracker';
import TransactionHistory from '../../components/TransactionHistory';
import PortfolioAnalytics from '../../components/PortfolioAnalytics';
import APIStatus from '../../components/APIStatus';

// Note: APIStatus only tracks Finnhub & Polygon APIs (5 calls/minute combined)
// Other APIs (NewsAPI, MarketAux, Alpha Vantage, RSS feeds) have separate limits

type FinanceTab = 'overview' | 'investments' | 'planning' | 'transactions';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');

  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: '📊', description: 'Dashboard & Net Worth' },
    { id: 'investments', label: 'INVESTMENTS', icon: '📈', description: 'Portfolio & Analytics' },
    { id: 'planning', label: 'PLANNING', icon: '🎯', description: 'Budget, Goals, Bills & Debt' },
    { id: 'transactions', label: 'TRANSACTIONS', icon: '📋', description: 'Transaction History' }
  ] as const;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-800 dark:text-white">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                FINANCIAL_HUB_TERMINAL
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-mono text-slate-600 dark:text-gray-400">LIVE</span>
                </div>
                <APIStatus />
              </div>
            </div>
            
            {/* Navigation to News Feed */}
            <a
              href="/"
              className="px-4 py-2 font-mono text-sm border border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-all rounded"
            >
              ← NEWS_FEED
            </a>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <nav className="flex overflow-x-auto justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as FinanceTab);
                  // Set default sub-tabs
                  if (tab.id === 'overview') setActiveSubTab('dashboard');
                  if (tab.id === 'investments') setActiveSubTab('portfolio');
                  if (tab.id === 'planning') setActiveSubTab('budget');
                  if (tab.id === 'transactions') setActiveSubTab('transactions');
                }}
                className={`px-6 py-4 font-mono text-sm border-b-2 transition-all whitespace-nowrap flex flex-col items-center gap-1 ${
                  activeTab === tab.id
                    ? 'border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                <span className="text-xs opacity-75">{tab.description}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      {activeTab !== 'transactions' && (
        <div className="border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <nav className="flex overflow-x-auto justify-center">
              {activeTab === 'overview' && [
                { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
                { id: 'networth', label: 'NET_WORTH', icon: '🏦' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`px-4 py-3 font-mono text-xs border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeSubTab === subTab.id
                      ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{subTab.icon}</span>
                  <span>{subTab.label}</span>
                </button>
              ))}
              
              {activeTab === 'investments' && [
                { id: 'portfolio', label: 'PORTFOLIO', icon: '📈' },
                { id: 'analytics', label: 'ANALYTICS', icon: '🔮' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`px-4 py-3 font-mono text-xs border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeSubTab === subTab.id
                      ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{subTab.icon}</span>
                  <span>{subTab.label}</span>
                </button>
              ))}
              
              {activeTab === 'planning' && [
                { id: 'budget', label: 'BUDGET', icon: '💰' },
                { id: 'goals', label: 'GOALS', icon: '🎯' },
                { id: 'bills', label: 'BILLS', icon: '📅' },
                { id: 'debt', label: 'DEBT', icon: '💳' },
                { id: 'credit', label: 'CREDIT', icon: '💎' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`px-4 py-3 font-mono text-xs border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeSubTab === subTab.id
                      ? 'border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{subTab.icon}</span>
                  <span>{subTab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Overview Tab Content */}
        {activeTab === 'overview' && activeSubTab === 'dashboard' && <FinancialDashboard />}
        {activeTab === 'overview' && activeSubTab === 'networth' && <NetWorthTracker />}
        
        {/* Investments Tab Content */}
        {activeTab === 'investments' && activeSubTab === 'portfolio' && <PortfolioTracker />}
        {activeTab === 'investments' && activeSubTab === 'analytics' && <PortfolioAnalytics />}
        
        {/* Planning Tab Content */}
        {activeTab === 'planning' && activeSubTab === 'budget' && <BudgetTracker />}
        {activeTab === 'planning' && activeSubTab === 'goals' && <GoalsTracker />}
        {activeTab === 'planning' && activeSubTab === 'bills' && <BillTracker />}
        {activeTab === 'planning' && activeSubTab === 'debt' && <DebtTracker />}
        {activeTab === 'planning' && activeSubTab === 'credit' && <CreditCardTracker />}
        
        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && <TransactionHistory />}
      </div>
    </div>
  );
}