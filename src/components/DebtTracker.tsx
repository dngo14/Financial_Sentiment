'use client';

import { useState, useEffect } from 'react';
import { DebtAccount } from '../lib/types';

export default function DebtTracker() {
  const [debts, setDebts] = useState<DebtAccount[]>([]);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [payoffStrategy, setPayoffStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  
  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'credit_card' as DebtAccount['type'],
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: '',
    creditLimit: ''
  });

  useEffect(() => {
    loadDebtData();
  }, []);

  const loadDebtData = () => {
    const savedDebts = localStorage.getItem('debt_accounts');
    
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    } else {
      // Default debt accounts
      const defaultDebts: DebtAccount[] = [
        { 
          id: '1', 
          name: 'Chase Freedom', 
          type: 'credit_card', 
          balance: 3500, 
          interestRate: 22.99, 
          minimumPayment: 105, 
          dueDate: '2024-11-15',
          creditLimit: 5000,
          lastUpdated: new Date().toISOString() 
        },
        { 
          id: '2', 
          name: 'Student Loan', 
          type: 'student_loan', 
          balance: 25000, 
          interestRate: 6.5, 
          minimumPayment: 280, 
          dueDate: '2024-11-01',
          lastUpdated: new Date().toISOString() 
        },
        { 
          id: '3', 
          name: 'Car Loan', 
          type: 'loan', 
          balance: 18000, 
          interestRate: 4.2, 
          minimumPayment: 425, 
          dueDate: '2024-11-10',
          lastUpdated: new Date().toISOString() 
        },
      ];
      setDebts(defaultDebts);
      localStorage.setItem('debt_accounts', JSON.stringify(defaultDebts));
    }
  };

  const saveDebts = (updatedDebts: DebtAccount[]) => {
    localStorage.setItem('debt_accounts', JSON.stringify(updatedDebts));
    setDebts(updatedDebts);
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance || !newDebt.interestRate) return;

    const debt: DebtAccount = {
      id: Date.now().toString(),
      name: newDebt.name,
      type: newDebt.type,
      balance: parseFloat(newDebt.balance),
      interestRate: parseFloat(newDebt.interestRate),
      minimumPayment: parseFloat(newDebt.minimumPayment) || 0,
      dueDate: newDebt.dueDate || new Date().toISOString().split('T')[0],
      creditLimit: newDebt.type === 'credit_card' && newDebt.creditLimit ? parseFloat(newDebt.creditLimit) : undefined,
      lastUpdated: new Date().toISOString()
    };

    const updatedDebts = [...debts, debt];
    saveDebts(updatedDebts);
    
    setNewDebt({
      name: '',
      type: 'credit_card',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: '',
      creditLimit: ''
    });
    setShowAddDebt(false);
  };

  const updateDebtBalance = (id: string, newBalance: number) => {
    const updatedDebts = debts.map(debt => 
      debt.id === id 
        ? { ...debt, balance: newBalance, lastUpdated: new Date().toISOString() }
        : debt
    );
    saveDebts(updatedDebts);
  };

  const makePayment = (id: string, paymentAmount: number) => {
    const updatedDebts = debts.map(debt => 
      debt.id === id 
        ? { ...debt, balance: Math.max(0, debt.balance - paymentAmount), lastUpdated: new Date().toISOString() }
        : debt
    );
    saveDebts(updatedDebts);
  };

  const deleteDebt = (id: string) => {
    const updatedDebts = debts.filter(d => d.id !== id);
    saveDebts(updatedDebts);
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

  const calculatePayoffTime = (debt: DebtAccount, extraPayment = 0) => {
    const monthlyPayment = debt.minimumPayment + extraPayment;
    const monthlyRate = debt.interestRate / 100 / 12;
    
    if (monthlyPayment <= debt.balance * monthlyRate) {
      return 'Never (payment too low)';
    }
    
    const months = Math.ceil(
      -Math.log(1 - (debt.balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
    );
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0) {
      return `${years}y ${remainingMonths}m`;
    }
    return `${months}m`;
  };

  const calculateTotalInterest = (debt: DebtAccount, extraPayment = 0) => {
    const monthlyPayment = debt.minimumPayment + extraPayment;
    const monthlyRate = debt.interestRate / 100 / 12;
    let balance = debt.balance;
    let totalInterest = 0;
    let months = 0;
    
    while (balance > 0.01 && months < 360) { // Max 30 years
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      
      if (principalPayment <= 0) break;
      
      totalInterest += interestPayment;
      balance -= principalPayment;
      months++;
    }
    
    return totalInterest;
  };

  const getSortedDebts = () => {
    if (payoffStrategy === 'snowball') {
      return [...debts].sort((a, b) => a.balance - b.balance);
    } else {
      return [...debts].sort((a, b) => b.interestRate - a.interestRate);
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const averageInterestRate = debts.length > 0 
    ? debts.reduce((sum, debt) => sum + (debt.interestRate * debt.balance), 0) / totalDebt
    : 0;

  const debtTypeColors = {
    credit_card: '#EC4899',
    loan: '#F97316',
    mortgage: '#EF4444',
    student_loan: '#8B5CF6',
    other: '#6B7280'
  };

  return (
    <div className="space-y-6">
      {/* Debt Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            DEBT_TRACKER
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={payoffStrategy}
              onChange={(e) => setPayoffStrategy(e.target.value as 'snowball' | 'avalanche')}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
            >
              <option value="avalanche">AVALANCHE (High Interest First)</option>
              <option value="snowball">SNOWBALL (Low Balance First)</option>
            </select>
            <button
              onClick={() => setShowAddDebt(!showAddDebt)}
              className="px-4 py-2 font-mono text-sm border border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
            >
              + ADD_DEBT
            </button>
          </div>
        </div>

        {/* Debt Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL DEBT</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(totalDebt)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MIN PAYMENTS</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
              {formatCurrency(totalMinimumPayments)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AVG INTEREST</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
              {averageInterestRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Add Debt Form */}
      {showAddDebt && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_DEBT
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DEBT NAME *
              </label>
              <input
                type="text"
                value={newDebt.name}
                onChange={(e) => setNewDebt({...newDebt, name: e.target.value})}
                placeholder="Capital One Card"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TYPE
              </label>
              <select
                value={newDebt.type}
                onChange={(e) => setNewDebt({...newDebt, type: e.target.value as DebtAccount['type']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              >
                <option value="credit_card">CREDIT CARD</option>
                <option value="loan">LOAN</option>
                <option value="mortgage">MORTGAGE</option>
                <option value="student_loan">STUDENT LOAN</option>
                <option value="other">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                BALANCE *
              </label>
              <input
                type="number"
                step="0.01"
                value={newDebt.balance}
                onChange={(e) => setNewDebt({...newDebt, balance: e.target.value})}
                placeholder="5000.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                INTEREST RATE (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={newDebt.interestRate}
                onChange={(e) => setNewDebt({...newDebt, interestRate: e.target.value})}
                placeholder="19.99"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                MINIMUM PAYMENT
              </label>
              <input
                type="number"
                step="0.01"
                value={newDebt.minimumPayment}
                onChange={(e) => setNewDebt({...newDebt, minimumPayment: e.target.value})}
                placeholder="150.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DUE DATE
              </label>
              <input
                type="date"
                value={newDebt.dueDate}
                onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            {newDebt.type === 'credit_card' && (
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  CREDIT LIMIT
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newDebt.creditLimit}
                  onChange={(e) => setNewDebt({...newDebt, creditLimit: e.target.value})}
                  placeholder="10000.00"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addDebt}
              disabled={!newDebt.name || !newDebt.balance || !newDebt.interestRate}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newDebt.name || !newDebt.balance || !newDebt.interestRate
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-red-500 text-red-400 hover:bg-red-500/10'
              }`}
            >
              ADD_DEBT
            </button>
            <button
              onClick={() => setShowAddDebt(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Debt Accounts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
            PAYOFF_STRATEGY: {payoffStrategy.toUpperCase()}
          </h3>
          <div className="text-sm font-mono text-slate-600 dark:text-gray-400">
            {debts.length} ACCOUNTS
          </div>
        </div>

        {getSortedDebts().map((debt, index) => {
          const utilizationRate = debt.creditLimit ? (debt.balance / debt.creditLimit) * 100 : 0;
          const payoffTime = calculatePayoffTime(debt);
          const totalInterest = calculateTotalInterest(debt);

          return (
            <div key={debt.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-white text-xs font-mono ${
                    index === 0 ? 'bg-red-500' : 'bg-gray-500'
                  }`}>
                    #{index + 1}
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: debtTypeColors[debt.type] }}
                  ></div>
                  <div>
                    <h4 className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                      {debt.name}
                    </h4>
                    <div className="text-xs font-mono text-slate-500 dark:text-gray-400 uppercase">
                      {debt.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDebt(debt.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                >
                  DELETE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">BALANCE</div>
                  <input
                    type="number"
                    step="0.01"
                    value={debt.balance}
                    onChange={(e) => updateDebtBalance(debt.id, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
                  />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">INTEREST RATE</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                    {debt.interestRate}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MIN PAYMENT</div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                    {formatCurrency(debt.minimumPayment)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">DUE DATE</div>
                  <div className="text-sm font-mono text-slate-800 dark:text-white">
                    {formatDate(debt.dueDate)}
                  </div>
                </div>
              </div>

              {debt.creditLimit && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                      UTILIZATION: {utilizationRate.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                      LIMIT: {formatCurrency(debt.creditLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        utilizationRate > 90 
                          ? 'bg-red-500' 
                          : utilizationRate > 70 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">PAYOFF TIME</div>
                  <div className="font-mono text-slate-800 dark:text-white">{payoffTime}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL INTEREST</div>
                  <div className="font-mono text-red-600 dark:text-red-400">{formatCurrency(totalInterest)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">QUICK PAYMENT</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => makePayment(debt.id, debt.minimumPayment)}
                      className="px-2 py-1 text-xs font-mono border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition-all rounded"
                    >
                      MIN
                    </button>
                    <button
                      onClick={() => makePayment(debt.id, debt.minimumPayment * 2)}
                      className="px-2 py-1 text-xs font-mono border border-green-500 text-green-400 hover:bg-green-500/10 transition-all rounded"
                    >
                      2X
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}