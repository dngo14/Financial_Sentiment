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

type FinanceTab = 'dashboard' | 'portfolio' | 'budget' | 'goals' | 'bills' | 'transactions' | 'networth' | 'debt' | 'credit';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
    { id: 'portfolio', label: 'PORTFOLIO', icon: '📈' },
    { id: 'budget', label: 'BUDGET', icon: '💰' },
    { id: 'goals', label: 'GOALS', icon: '🎯' },
    { id: 'bills', label: 'BILLS', icon: '📅' },
    { id: 'transactions', label: 'TRANSACTIONS', icon: '📋' },
    { id: 'networth', label: 'NET_WORTH', icon: '🏦' },
    { id: 'debt', label: 'DEBT', icon: '💳' },
    { id: 'credit', label: 'CREDIT_CARDS', icon: '💎' }
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-mono text-slate-600 dark:text-gray-400">LIVE</span>
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
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FinanceTab)}
                className={`px-6 py-4 font-mono text-sm border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-green-400 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-transparent text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <FinancialDashboard />}
        {activeTab === 'portfolio' && <PortfolioTracker />}
        {activeTab === 'budget' && <BudgetTracker />}
        {activeTab === 'goals' && <GoalsTracker />}
        {activeTab === 'bills' && <BillTracker />}
        {activeTab === 'transactions' && <TransactionHistory />}
        {activeTab === 'networth' && <NetWorthTracker />}
        {activeTab === 'debt' && <DebtTracker />}
        {activeTab === 'credit' && <CreditCardTracker />}
      </div>
    </div>
  );
}