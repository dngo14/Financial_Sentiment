'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from '../lib/types';

export default function CreditCardTracker() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  
  const [newCard, setNewCard] = useState({
    name: '',
    bank: '',
    balance: '',
    creditLimit: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: ''
  });

  useEffect(() => {
    loadCreditCardData();
  }, []);

  const loadCreditCardData = () => {
    const savedCards = localStorage.getItem('credit_cards');
    
    if (savedCards) {
      setCreditCards(JSON.parse(savedCards));
    } else {
      // Default credit cards
      const defaultCards: CreditCard[] = [
        { 
          id: '1', 
          name: 'Chase Sapphire Preferred', 
          bank: 'Chase',
          balance: 1200, 
          creditLimit: 10000,
          interestRate: 20.99, 
          minimumPayment: 35, 
          dueDate: '2024-11-15',
          lastPayment: {
            amount: 500,
            date: '2024-10-15'
          },
          lastUpdated: new Date().toISOString() 
        },
        { 
          id: '2', 
          name: 'Capital One Venture', 
          bank: 'Capital One',
          balance: 850, 
          creditLimit: 7500,
          interestRate: 18.74, 
          minimumPayment: 25, 
          dueDate: '2024-11-20',
          lastPayment: {
            amount: 200,
            date: '2024-10-20'
          },
          lastUpdated: new Date().toISOString() 
        },
      ];
      setCreditCards(defaultCards);
      localStorage.setItem('credit_cards', JSON.stringify(defaultCards));
    }
  };

  const saveCreditCards = (updatedCards: CreditCard[]) => {
    localStorage.setItem('credit_cards', JSON.stringify(updatedCards));
    setCreditCards(updatedCards);
  };

  const addCreditCard = () => {
    if (!newCard.name || !newCard.bank || !newCard.creditLimit) return;

    const card: CreditCard = {
      id: Date.now().toString(),
      name: newCard.name,
      bank: newCard.bank,
      balance: parseFloat(newCard.balance) || 0,
      creditLimit: parseFloat(newCard.creditLimit),
      interestRate: parseFloat(newCard.interestRate) || 0,
      minimumPayment: parseFloat(newCard.minimumPayment) || 0,
      dueDate: newCard.dueDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    };

    const updatedCards = [...creditCards, card];
    saveCreditCards(updatedCards);
    
    setNewCard({
      name: '',
      bank: '',
      balance: '',
      creditLimit: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: ''
    });
    setShowAddCard(false);
  };

  const updateCardBalance = (id: string, newBalance: number) => {
    const updatedCards = creditCards.map(card => 
      card.id === id 
        ? { ...card, balance: newBalance, lastUpdated: new Date().toISOString() }
        : card
    );
    saveCreditCards(updatedCards);
  };

  const makePayment = (id: string, paymentAmount: number) => {
    const updatedCards = creditCards.map(card => {
      if (card.id === id) {
        const newBalance = Math.max(0, card.balance - paymentAmount);
        const newMinPayment = newBalance > 0 ? Math.max(25, newBalance * 0.02) : 0;
        return { 
          ...card, 
          balance: newBalance,
          minimumPayment: newMinPayment,
          lastPayment: {
            amount: paymentAmount,
            date: new Date().toISOString().split('T')[0]
          },
          lastUpdated: new Date().toISOString() 
        };
      }
      return card;
    });
    saveCreditCards(updatedCards);
  };

  const deleteCreditCard = (id: string) => {
    const updatedCards = creditCards.filter(c => c.id !== id);
    saveCreditCards(updatedCards);
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

  const getUtilizationRate = (balance: number, limit: number) => {
    return limit > 0 ? (balance / limit) * 100 : 0;
  };

  const getCreditScore = () => {
    const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);
    const totalLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
    const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
    
    // Simplified credit score estimation based on utilization
    if (overallUtilization <= 10) return { score: 800, grade: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (overallUtilization <= 30) return { score: 750, grade: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (overallUtilization <= 50) return { score: 650, grade: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { score: 550, grade: 'Poor', color: 'text-red-600 dark:text-red-400' };
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalBalance = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalMinPayments = creditCards.reduce((sum, card) => sum + card.minimumPayment, 0);
  const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  const creditEstimate = getCreditScore();

  const bankColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#F43F5E'
  ];

  return (
    <div className="space-y-6">
      {/* Credit Card Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            CREDIT_CARD_TRACKER
          </h2>
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="px-4 py-2 font-mono text-sm border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-all"
          >
            + ADD_CARD
          </button>
        </div>

        {/* Credit Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL BALANCE</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(totalBalance)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL LIMIT</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {formatCurrency(totalLimit)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">UTILIZATION</div>
            <div className={`text-2xl font-bold font-mono ${
              overallUtilization <= 30 
                ? 'text-green-600 dark:text-green-400' 
                : overallUtilization <= 50
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {overallUtilization.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">CREDIT ESTIMATE</div>
            <div className={`text-2xl font-bold font-mono ${creditEstimate.color}`}>
              {creditEstimate.score}
            </div>
            <div className={`text-xs font-mono ${creditEstimate.color}`}>
              {creditEstimate.grade}
            </div>
          </div>
        </div>
      </div>

      {/* Add Credit Card Form */}
      {showAddCard && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_CREDIT_CARD
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CARD NAME *
              </label>
              <input
                type="text"
                value={newCard.name}
                onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                placeholder="Chase Freedom Unlimited"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                BANK *
              </label>
              <input
                type="text"
                value={newCard.bank}
                onChange={(e) => setNewCard({...newCard, bank: e.target.value})}
                placeholder="Chase"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CURRENT BALANCE
              </label>
              <input
                type="number"
                step="0.01"
                value={newCard.balance}
                onChange={(e) => setNewCard({...newCard, balance: e.target.value})}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CREDIT LIMIT *
              </label>
              <input
                type="number"
                step="0.01"
                value={newCard.creditLimit}
                onChange={(e) => setNewCard({...newCard, creditLimit: e.target.value})}
                placeholder="5000.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                INTEREST RATE (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={newCard.interestRate}
                onChange={(e) => setNewCard({...newCard, interestRate: e.target.value})}
                placeholder="19.99"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DUE DATE
              </label>
              <input
                type="date"
                value={newCard.dueDate}
                onChange={(e) => setNewCard({...newCard, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addCreditCard}
              disabled={!newCard.name || !newCard.bank || !newCard.creditLimit}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newCard.name || !newCard.bank || !newCard.creditLimit
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-purple-500 text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              ADD_CARD
            </button>
            <button
              onClick={() => setShowAddCard(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Credit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {creditCards.map((card, index) => {
          const utilizationRate = getUtilizationRate(card.balance, card.creditLimit);
          const daysUntilDue = getDaysUntilDue(card.dueDate);
          const bankColor = bankColors[index % bankColors.length];

          return (
            <div key={card.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Card Header */}
              <div 
                className="p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${bankColor}dd, ${bankColor}aa)` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-mono text-lg font-bold">{card.name}</h3>
                    <div className="font-mono text-sm opacity-90">{card.bank}</div>
                  </div>
                  <button
                    onClick={() => deleteCreditCard(card.id)}
                    className="text-white/80 hover:text-white font-mono text-xs"
                  >
                    DELETE
                  </button>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs opacity-75 font-mono">BALANCE</div>
                    <div className="text-2xl font-bold font-mono">{formatCurrency(card.balance)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75 font-mono">LIMIT</div>
                    <div className="text-lg font-mono">{formatCurrency(card.creditLimit)}</div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Utilization Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                      UTILIZATION: {utilizationRate.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                      AVAILABLE: {formatCurrency(card.creditLimit - card.balance)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        utilizationRate > 90 
                          ? 'bg-red-500' 
                          : utilizationRate > 70 
                          ? 'bg-yellow-500' 
                          : utilizationRate > 30
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">INTEREST RATE</div>
                    <div className="font-mono text-slate-800 dark:text-white">{card.interestRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MIN PAYMENT</div>
                    <div className="font-mono text-slate-800 dark:text-white">{formatCurrency(card.minimumPayment)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">DUE DATE</div>
                    <div className={`font-mono ${
                      daysUntilDue <= 3 
                        ? 'text-red-600 dark:text-red-400' 
                        : daysUntilDue <= 7
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-slate-800 dark:text-white'
                    }`}>
                      {formatDate(card.dueDate)}
                      <span className="text-xs ml-1">
                        ({daysUntilDue}d)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">LAST PAYMENT</div>
                    <div className="font-mono text-slate-800 dark:text-white">
                      {card.lastPayment ? formatCurrency(card.lastPayment.amount) : 'None'}
                    </div>
                  </div>
                </div>

                {/* Payment Actions */}
                <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-mono text-slate-600 dark:text-gray-400">QUICK PAYMENT</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => makePayment(card.id, card.minimumPayment)}
                        disabled={card.balance === 0}
                        className={`px-3 py-1 text-xs font-mono border transition-all rounded ${
                          card.balance === 0
                            ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                            : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
                        }`}
                      >
                        MIN ({formatCurrency(card.minimumPayment)})
                      </button>
                      <button
                        onClick={() => makePayment(card.id, card.balance)}
                        disabled={card.balance === 0}
                        className={`px-3 py-1 text-xs font-mono border transition-all rounded ${
                          card.balance === 0
                            ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                            : 'border-green-500 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        FULL
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={card.balance}
                      onChange={(e) => updateCardBalance(card.id, parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-purple-400"
                      placeholder="Update balance"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {creditCards.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
            [ NO_CREDIT_CARDS_FOUND ]
          </div>
          <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
            Add your first credit card to get started
          </div>
        </div>
      )}
    </div>
  );
}