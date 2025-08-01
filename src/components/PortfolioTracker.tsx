'use client';

import { useState, useEffect } from 'react';
import { PortfolioHolding, FinnhubQuote, OptionPosition } from '../lib/types';
import { TransactionManager } from '../lib/transactions';
import APIStatus from './APIStatus';
import AIInsights from './AIInsights';

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [options, setOptions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stocks' | 'options'>('stocks');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    name: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: ''
  });
  const [newOption, setNewOption] = useState({
    symbol: '',
    contractSymbol: '',
    type: 'call' as 'call' | 'put',
    action: 'buy' as 'buy' | 'sell',
    strategy: 'long_call' as OptionPosition['strategy'],
    strikePrice: '',
    expirationDate: '',
    quantity: '',
    premium: '',
    purchaseDate: ''
  });

  useEffect(() => {
    loadPortfolio();
    loadOptions();
  }, []);

  const loadPortfolio = () => {
    const savedHoldings = localStorage.getItem('portfolio_holdings');
    if (savedHoldings) {
      const parsed = JSON.parse(savedHoldings);
      setHoldings(parsed);
      updatePrices(parsed);
    }
  };

  const savePortfolio = (updatedHoldings: PortfolioHolding[]) => {
    localStorage.setItem('portfolio_holdings', JSON.stringify(updatedHoldings));
    setHoldings(updatedHoldings);
  };

  const loadOptions = () => {
    const savedOptions = localStorage.getItem('portfolio_options');
    if (savedOptions) {
      setOptions(JSON.parse(savedOptions));
    }
  };

  const saveOptions = (updatedOptions: OptionPosition[]) => {
    localStorage.setItem('portfolio_options', JSON.stringify(updatedOptions));
    setOptions(updatedOptions);
  };

  const updatePrices = async (holdingsToUpdate: PortfolioHolding[]) => {
    if (holdingsToUpdate.length === 0) return;
    
    setLoading(true);
    try {
      const updatedHoldings = await Promise.all(
        holdingsToUpdate.map(async (holding) => {
          try {
            const response = await fetch(`/api/stock-price?symbol=${holding.symbol}`);
            if (response.ok) {
              const quote: FinnhubQuote = await response.json();
              return {
                ...holding,
                currentPrice: quote.c,
                lastUpdated: new Date().toISOString()
              };
            } else if (response.status === 429) {
              const errorData = await response.json();
              console.warn(`Rate limit hit for ${holding.symbol}: ${errorData.error}`);
              return holding; // Keep existing data
            }
            return holding;
          } catch (error) {
            console.error(`Failed to update price for ${holding.symbol}:`, error);
            return holding;
          }
        })
      );
      
      savePortfolio(updatedHoldings);
    } catch (error) {
      console.error('Failed to update prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const addHolding = async () => {
    if (!newHolding.symbol || !newHolding.quantity || !newHolding.purchasePrice) {
      return;
    }

    setLoading(true);
    try {
      // Get current price for the new holding
      const response = await fetch(`/api/stock-price?symbol=${newHolding.symbol.toUpperCase()}`);
      let currentPrice = parseFloat(newHolding.purchasePrice);
      
      if (response.ok) {
        const quote: FinnhubQuote = await response.json();
        currentPrice = quote.c;
      }

      const holding: PortfolioHolding = {
        id: Date.now().toString(),
        symbol: newHolding.symbol.toUpperCase(),
        name: newHolding.name || newHolding.symbol.toUpperCase(),
        quantity: parseFloat(newHolding.quantity),
        purchasePrice: parseFloat(newHolding.purchasePrice),
        currentPrice,
        purchaseDate: newHolding.purchaseDate || new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString()
      };

      const updatedHoldings = [...holdings, holding];
      savePortfolio(updatedHoldings);
      
      // Add transaction record
      TransactionManager.addStockTransaction(
        'buy',
        holding.symbol,
        holding.quantity,
        holding.purchasePrice,
        holding.purchaseDate
      );
      
      setNewHolding({
        symbol: '',
        name: '',
        quantity: '',
        purchasePrice: '',
        purchaseDate: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add holding:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeHolding = (id: string) => {
    const holding = holdings.find(h => h.id === id);
    if (holding) {
      // Add sell transaction record
      TransactionManager.addStockTransaction(
        'sell',
        holding.symbol,
        holding.quantity,
        holding.currentPrice
      );
    }
    const updatedHoldings = holdings.filter(h => h.id !== id);
    savePortfolio(updatedHoldings);
  };

  const addOption = () => {
    if (!newOption.symbol || !newOption.strikePrice || !newOption.expirationDate || !newOption.quantity || !newOption.premium) {
      return;
    }

    const option: OptionPosition = {
      id: Date.now().toString(),
      symbol: newOption.symbol.toUpperCase(),
      contractSymbol: newOption.contractSymbol || `${newOption.symbol.toUpperCase()}${newOption.expirationDate.replace(/-/g, '')}${newOption.type.toUpperCase()}${newOption.strikePrice}`,
      type: newOption.type,
      action: newOption.action,
      strategy: newOption.strategy,
      strikePrice: parseFloat(newOption.strikePrice),
      expirationDate: newOption.expirationDate,
      quantity: parseInt(newOption.quantity),
      premium: parseFloat(newOption.premium),
      totalPremium: parseFloat(newOption.premium) * parseInt(newOption.quantity) * 100, // Options are typically $100 per contract
      currentPrice: parseFloat(newOption.premium),
      purchaseDate: newOption.purchaseDate || new Date().toISOString().split('T')[0],
      isOpen: true,
      lastUpdated: new Date().toISOString()
    };

    const updatedOptions = [...options, option];
    saveOptions(updatedOptions);
    
    // Add transaction record
    TransactionManager.addTransaction({
      type: newOption.action === 'buy' ? 'buy' : 'sell',
      category: 'portfolio',
      description: `${newOption.action.toUpperCase()} ${newOption.quantity} ${newOption.type} options ${newOption.symbol} ${newOption.strikePrice} ${newOption.expirationDate}`,
      amount: option.totalPremium,
      date: option.purchaseDate,
      relatedName: option.contractSymbol,
      metadata: {
        symbol: option.symbol,
        quantity: option.quantity,
        price: option.premium
      }
    });
    
    setNewOption({
      symbol: '',
      contractSymbol: '',
      type: 'call',
      action: 'buy',
      strategy: 'long_call',
      strikePrice: '',
      expirationDate: '',
      quantity: '',
      premium: '',
      purchaseDate: ''
    });
    setShowAddForm(false);
  };

  const removeOption = (id: string) => {
    const option = options.find(o => o.id === id);
    if (option) {
      // Add close position transaction
      TransactionManager.addTransaction({
        type: option.action === 'buy' ? 'sell' : 'buy',
        category: 'portfolio',
        description: `CLOSE ${option.quantity} ${option.type} options ${option.symbol} ${option.strikePrice} ${option.expirationDate}`,
        amount: option.totalPremium,
        date: new Date().toISOString().split('T')[0],
        relatedName: option.contractSymbol,
        metadata: {
          symbol: option.symbol,
          quantity: option.quantity,
          price: option.currentPrice
        }
      });
    }
    const updatedOptions = options.filter(o => o.id !== id);
    saveOptions(updatedOptions);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const calculateTotalValue = () => {
    const stockValue = holdings.reduce((total, holding) => {
      return total + (holding.currentPrice * holding.quantity);
    }, 0);
    
    const optionsValue = options.reduce((total, option) => {
      return total + (option.currentPrice * option.quantity * 100); // Options are typically $100 per contract
    }, 0);
    
    return stockValue + optionsValue;
  };

  const calculateTotalGainLoss = () => {
    const stockGainLoss = holdings.reduce((total, holding) => {
      const purchaseValue = holding.purchasePrice * holding.quantity;
      const currentValue = holding.currentPrice * holding.quantity;
      return total + (currentValue - purchaseValue);
    }, 0);
    
    const optionsGainLoss = options.reduce((total, option) => {
      const purchaseValue = option.premium * option.quantity * 100;
      const currentValue = option.currentPrice * option.quantity * 100;
      return total + (currentValue - purchaseValue);
    }, 0);
    
    return stockGainLoss + optionsGainLoss;
  };

  const totalValue = calculateTotalValue();
  const totalGainLoss = calculateTotalGainLoss();
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            PORTFOLIO_TRACKER_&_OPTIONS
          </h2>
          <div className="flex items-center gap-3">
            <APIStatus className="mr-2" />
            <button
              onClick={() => updatePrices(holdings)}
              disabled={loading || holdings.length === 0}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                loading || holdings.length === 0
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              <span className={loading ? 'animate-spin' : ''}>⟳</span>
              {loading ? 'UPDATING...' : 'UPDATE_PRICES'}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 font-mono text-sm border border-green-500 text-green-400 hover:bg-green-500/10 transition-all"
            >
              + ADD_{activeTab === 'stocks' ? 'HOLDING' : 'OPTION'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-4 py-2 font-mono text-sm border transition-all ${
              activeTab === 'stocks'
                ? 'border-green-500 text-green-400 bg-green-500/10'
                : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
            }`}
          >
            📈 STOCKS [{holdings.length}]
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`px-4 py-2 font-mono text-sm border transition-all ${
              activeTab === 'options'
                ? 'border-green-500 text-green-400 bg-green-500/10'
                : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
            }`}
          >
            ⚡ OPTIONS [{options.length}]
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL VALUE</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
              {formatCurrency(totalValue)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL GAIN/LOSS</div>
            <div className={`text-2xl font-bold font-mono ${
              totalGainLoss >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(totalGainLoss)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL RETURN</div>
            <div className={`text-2xl font-bold font-mono ${
              totalGainLossPercent >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatPercent(totalGainLossPercent)}
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_{activeTab === 'stocks' ? 'HOLDING' : 'OPTION'}
          </h3>
          {activeTab === 'stocks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  SYMBOL *
                </label>
                <input
                  type="text"
                  value={newHolding.symbol}
                  onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value.toUpperCase()})}
                  placeholder="AAPL"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  COMPANY NAME
                </label>
                <input
                  type="text"
                  value={newHolding.name}
                  onChange={(e) => setNewHolding({...newHolding, name: e.target.value})}
                  placeholder="Apple Inc."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  QUANTITY *
                </label>
                <input
                  type="number"
                  value={newHolding.quantity}
                  onChange={(e) => setNewHolding({...newHolding, quantity: e.target.value})}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  PURCHASE PRICE *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newHolding.purchasePrice}
                  onChange={(e) => setNewHolding({...newHolding, purchasePrice: e.target.value})}
                  placeholder="150.00"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  PURCHASE DATE
                </label>
                <input
                  type="date"
                  value={newHolding.purchaseDate}
                  onChange={(e) => setNewHolding({...newHolding, purchaseDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  UNDERLYING SYMBOL *
                </label>
                <input
                  type="text"
                  value={newOption.symbol}
                  onChange={(e) => setNewOption({...newOption, symbol: e.target.value.toUpperCase()})}
                  placeholder="AAPL"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  CONTRACT SYMBOL
                </label>
                <input
                  type="text"
                  value={newOption.contractSymbol}
                  onChange={(e) => setNewOption({...newOption, contractSymbol: e.target.value})}
                  placeholder="AAPL240315C00150000"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  OPTION TYPE *
                </label>
                <select
                  value={newOption.type}
                  onChange={(e) => setNewOption({...newOption, type: e.target.value as 'call' | 'put'})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="call">CALL</option>
                  <option value="put">PUT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  ACTION *
                </label>
                <select
                  value={newOption.action}
                  onChange={(e) => setNewOption({...newOption, action: e.target.value as 'buy' | 'sell'})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="buy">BUY TO OPEN</option>
                  <option value="sell">SELL TO OPEN</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  STRATEGY
                </label>
                <select
                  value={newOption.strategy}
                  onChange={(e) => setNewOption({...newOption, strategy: e.target.value as OptionPosition['strategy']})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                >
                  <option value="long_call">LONG CALL</option>
                  <option value="long_put">LONG PUT</option>
                  <option value="short_call">SHORT CALL</option>
                  <option value="short_put">SHORT PUT</option>
                  <option value="covered_call">COVERED CALL</option>
                  <option value="protective_put">PROTECTIVE PUT</option>
                  <option value="spread">SPREAD</option>
                  <option value="other">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  STRIKE PRICE *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newOption.strikePrice}
                  onChange={(e) => setNewOption({...newOption, strikePrice: e.target.value})}
                  placeholder="150.00"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  EXPIRATION DATE *
                </label>
                <input
                  type="date"
                  value={newOption.expirationDate}
                  onChange={(e) => setNewOption({...newOption, expirationDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  CONTRACTS *
                </label>
                <input
                  type="number"
                  value={newOption.quantity}
                  onChange={(e) => setNewOption({...newOption, quantity: e.target.value})}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                  PREMIUM PER CONTRACT *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newOption.premium}
                  onChange={(e) => setNewOption({...newOption, premium: e.target.value})}
                  placeholder="5.50"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={activeTab === 'stocks' ? addHolding : addOption}
              disabled={activeTab === 'stocks' 
                ? (loading || !newHolding.symbol || !newHolding.quantity || !newHolding.purchasePrice)
                : (!newOption.symbol || !newOption.strikePrice || !newOption.expirationDate || !newOption.quantity || !newOption.premium)
              }
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                (activeTab === 'stocks' 
                  ? (loading || !newHolding.symbol || !newHolding.quantity || !newHolding.purchasePrice)
                  : (!newOption.symbol || !newOption.strikePrice || !newOption.expirationDate || !newOption.quantity || !newOption.premium))
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-green-500 text-green-400 hover:bg-green-500/10'
              }`}
            >
              {loading ? 'ADDING...' : `ADD_${activeTab === 'stocks' ? 'HOLDING' : 'OPTION'}`}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Holdings/Options Table */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white">
            {activeTab === 'stocks' ? `HOLDINGS [${holdings.length}]` : `OPTIONS [${options.length}]`}
          </h3>
        </div>
        
        {activeTab === 'stocks' ? (
          holdings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
                [ NO_HOLDINGS_FOUND ]
              </div>
              <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
                Add your first stock holding to get started
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      SYMBOL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      QUANTITY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      PURCHASE_PRICE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      CURRENT_PRICE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      TOTAL_VALUE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      GAIN/LOSS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {holdings.map((holding) => {
                    const totalValue = holding.currentPrice * holding.quantity;
                    const purchaseValue = holding.purchasePrice * holding.quantity;
                    const gainLoss = totalValue - purchaseValue;
                    const gainLossPercent = (gainLoss / purchaseValue) * 100;
                    
                    return (
                      <tr key={holding.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                              {holding.symbol}
                            </div>
                            <div className="font-mono text-xs text-slate-500 dark:text-gray-400">
                              {holding.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {holding.quantity}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {formatCurrency(holding.purchasePrice)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {formatCurrency(holding.currentPrice)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {formatCurrency(totalValue)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-mono text-sm ${
                            gainLoss >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(gainLoss)}
                          </div>
                          <div className={`font-mono text-xs ${
                            gainLoss >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatPercent(gainLossPercent)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeHolding(holding.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                          >
                            DELETE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          options.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
                [ NO_OPTIONS_FOUND ]
              </div>
              <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
                Add your first options position to get started
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      CONTRACT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      TYPE/STRATEGY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      STRIKE/EXP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      CONTRACTS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      PREMIUM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      TOTAL_VALUE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      GAIN/LOSS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-mono text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {options.map((option) => {
                    const currentValue = option.currentPrice * option.quantity * 100;
                    const purchaseValue = option.premium * option.quantity * 100;
                    const gainLoss = currentValue - purchaseValue;
                    const gainLossPercent = (gainLoss / purchaseValue) * 100;
                    const daysToExpiry = Math.ceil((new Date(option.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={option.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                              {option.symbol}
                            </div>
                            <div className="font-mono text-xs text-slate-500 dark:text-gray-400">
                              {option.contractSymbol || `${option.symbol} ${option.type.toUpperCase()}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              option.type === 'call'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {option.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-gray-400 mt-1">
                            {option.strategy.replace('_', ' ').toUpperCase()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm text-slate-800 dark:text-white">
                            ${option.strikePrice}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-gray-400">
                            {new Date(option.expirationDate).toLocaleDateString()}
                          </div>
                          <div className={`font-mono text-xs ${
                            daysToExpiry <= 7
                              ? 'text-red-600 dark:text-red-400'
                              : daysToExpiry <= 30
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-slate-500 dark:text-gray-400'
                          }`}>
                            {daysToExpiry}d left
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {option.quantity}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm text-slate-800 dark:text-white">
                            ${option.premium.toFixed(2)}
                          </div>
                          <div className="font-mono text-xs text-slate-500 dark:text-gray-400">
                            ${option.currentPrice.toFixed(2)} current
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-slate-800 dark:text-white">
                          {formatCurrency(currentValue)}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-mono text-sm ${
                            gainLoss >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatCurrency(gainLoss)}
                          </div>
                          <div className={`font-mono text-xs ${
                            gainLoss >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatPercent(gainLossPercent)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeOption(option.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                          >
                            CLOSE
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* AI Portfolio Insights */}
      <div className="mt-6">
        <AIInsights 
          type="portfolio" 
          data={{
            holdings,
            options,
            totalValue: calculateTotalValue(),
            cash: 0, // You might want to add cash tracking
            performance: formatPercent(totalGainLossPercent)
          }}
          compact
        />
      </div>
    </div>
  );
}