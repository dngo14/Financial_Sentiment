'use client';

import { useState, useEffect } from 'react';
import { Asset, Liability } from '../lib/types';

export default function NetWorthTracker() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'cash' as Asset['type'],
    value: ''
  });

  const [newLiability, setNewLiability] = useState({
    name: '',
    type: 'credit_card' as Liability['type'],
    balance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: ''
  });

  useEffect(() => {
    loadNetWorthData();
  }, []);

  const loadNetWorthData = () => {
    const savedAssets = localStorage.getItem('networth_assets');
    const savedLiabilities = localStorage.getItem('networth_liabilities');
    
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
      // Default assets
      const defaultAssets: Asset[] = [
        { id: '1', name: 'Checking Account', type: 'cash', value: 5000, lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Savings Account', type: 'cash', value: 15000, lastUpdated: new Date().toISOString() },
        { id: '3', name: 'Primary Residence', type: 'property', value: 350000, lastUpdated: new Date().toISOString() },
      ];
      setAssets(defaultAssets);
      localStorage.setItem('networth_assets', JSON.stringify(defaultAssets));
    }
    
    if (savedLiabilities) {
      setLiabilities(JSON.parse(savedLiabilities));
    } else {
      // Default liabilities
      const defaultLiabilities: Liability[] = [
        { id: '1', name: 'Mortgage', type: 'mortgage', balance: 280000, interestRate: 3.5, minimumPayment: 1500, dueDate: '2024-12-01', lastUpdated: new Date().toISOString() },
        { id: '2', name: 'Credit Card', type: 'credit_card', balance: 2500, interestRate: 18.9, minimumPayment: 75, dueDate: '2024-11-15', lastUpdated: new Date().toISOString() },
      ];
      setLiabilities(defaultLiabilities);
      localStorage.setItem('networth_liabilities', JSON.stringify(defaultLiabilities));
    }
  };

  const saveAssets = (updatedAssets: Asset[]) => {
    localStorage.setItem('networth_assets', JSON.stringify(updatedAssets));
    setAssets(updatedAssets);
  };

  const saveLiabilities = (updatedLiabilities: Liability[]) => {
    localStorage.setItem('networth_liabilities', JSON.stringify(updatedLiabilities));
    setLiabilities(updatedLiabilities);
  };

  const addAsset = () => {
    if (!newAsset.name || !newAsset.value) return;

    const asset: Asset = {
      id: Date.now().toString(),
      name: newAsset.name,
      type: newAsset.type,
      value: parseFloat(newAsset.value),
      lastUpdated: new Date().toISOString()
    };

    const updatedAssets = [...assets, asset];
    saveAssets(updatedAssets);
    
    setNewAsset({
      name: '',
      type: 'cash',
      value: ''
    });
    setShowAddAsset(false);
  };

  const addLiability = () => {
    if (!newLiability.name || !newLiability.balance) return;

    const liability: Liability = {
      id: Date.now().toString(),
      name: newLiability.name,
      type: newLiability.type,
      balance: parseFloat(newLiability.balance),
      interestRate: parseFloat(newLiability.interestRate) || 0,
      minimumPayment: parseFloat(newLiability.minimumPayment) || 0,
      dueDate: newLiability.dueDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString()
    };

    const updatedLiabilities = [...liabilities, liability];
    saveLiabilities(updatedLiabilities);
    
    setNewLiability({
      name: '',
      type: 'credit_card',
      balance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: ''
    });
    setShowAddLiability(false);
  };

  const updateAssetValue = (id: string, newValue: number) => {
    const updatedAssets = assets.map(asset => 
      asset.id === id 
        ? { ...asset, value: newValue, lastUpdated: new Date().toISOString() }
        : asset
    );
    saveAssets(updatedAssets);
  };

  const updateLiabilityBalance = (id: string, newBalance: number) => {
    const updatedLiabilities = liabilities.map(liability => 
      liability.id === id 
        ? { ...liability, balance: newBalance, lastUpdated: new Date().toISOString() }
        : liability
    );
    saveLiabilities(updatedLiabilities);
  };

  const deleteAsset = (id: string) => {
    const updatedAssets = assets.filter(a => a.id !== id);
    saveAssets(updatedAssets);
  };

  const deleteLiability = (id: string) => {
    const updatedLiabilities = liabilities.filter(l => l.id !== id);
    saveLiabilities(updatedLiabilities);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const assetTypeColors = {
    property: '#10B981',
    vehicle: '#3B82F6',
    investment: '#8B5CF6',
    cash: '#F59E0B',
    other: '#6B7280'
  };

  const liabilityTypeColors = {
    mortgage: '#EF4444',
    loan: '#F97316',
    credit_card: '#EC4899',
    other: '#6B7280'
  };

  return (
    <div className="space-y-6">
      {/* Net Worth Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            NET_WORTH_TRACKER
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddAsset(!showAddAsset)}
              className="px-4 py-2 font-mono text-sm border border-green-500 text-green-400 hover:bg-green-500/10 transition-all"
            >
              + ADD_ASSET
            </button>
            <button
              onClick={() => setShowAddLiability(!showAddLiability)}
              className="px-4 py-2 font-mono text-sm border border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
            >
              + ADD_LIABILITY
            </button>
          </div>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL ASSETS</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {formatCurrency(totalAssets)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL LIABILITIES</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(totalLiabilities)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET WORTH</div>
            <div className={`text-2xl font-bold font-mono ${
              netWorth >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(netWorth)}
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Form */}
      {showAddAsset && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_ASSET
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                ASSET NAME *
              </label>
              <input
                type="text"
                value={newAsset.name}
                onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                placeholder="401k Account"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TYPE
              </label>
              <select
                value={newAsset.type}
                onChange={(e) => setNewAsset({...newAsset, type: e.target.value as Asset['type']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
              >
                <option value="cash">CASH</option>
                <option value="investment">INVESTMENT</option>
                <option value="property">PROPERTY</option>
                <option value="vehicle">VEHICLE</option>
                <option value="other">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                VALUE *
              </label>
              <input
                type="number"
                step="0.01"
                value={newAsset.value}
                onChange={(e) => setNewAsset({...newAsset, value: e.target.value})}
                placeholder="50000.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addAsset}
              disabled={!newAsset.name || !newAsset.value}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newAsset.name || !newAsset.value
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-green-500 text-green-400 hover:bg-green-500/10'
              }`}
            >
              ADD_ASSET
            </button>
            <button
              onClick={() => setShowAddAsset(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Add Liability Form */}
      {showAddLiability && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_LIABILITY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                LIABILITY NAME *
              </label>
              <input
                type="text"
                value={newLiability.name}
                onChange={(e) => setNewLiability({...newLiability, name: e.target.value})}
                placeholder="Student Loan"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TYPE
              </label>
              <select
                value={newLiability.type}
                onChange={(e) => setNewLiability({...newLiability, type: e.target.value as Liability['type']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              >
                <option value="credit_card">CREDIT CARD</option>
                <option value="loan">LOAN</option>
                <option value="mortgage">MORTGAGE</option>
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
                value={newLiability.balance}
                onChange={(e) => setNewLiability({...newLiability, balance: e.target.value})}
                placeholder="25000.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                INTEREST RATE (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={newLiability.interestRate}
                onChange={(e) => setNewLiability({...newLiability, interestRate: e.target.value})}
                placeholder="6.5"
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
                value={newLiability.minimumPayment}
                onChange={(e) => setNewLiability({...newLiability, minimumPayment: e.target.value})}
                placeholder="350.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DUE DATE
              </label>
              <input
                type="date"
                value={newLiability.dueDate}
                onChange={(e) => setNewLiability({...newLiability, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addLiability}
              disabled={!newLiability.name || !newLiability.balance}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newLiability.name || !newLiability.balance
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-red-500 text-red-400 hover:bg-red-500/10'
              }`}
            >
              ADD_LIABILITY
            </button>
            <button
              onClick={() => setShowAddLiability(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Assets and Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            ASSETS [{assets.length}]
          </h3>
          <div className="space-y-3">
            {assets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded border">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: assetTypeColors[asset.type] }}
                  ></div>
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                      {asset.name}
                    </div>
                    <div className="font-mono text-xs text-slate-500 dark:text-gray-400 uppercase">
                      {asset.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={asset.value}
                    onChange={(e) => updateAssetValue(asset.id, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-green-400"
                  />
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            LIABILITIES [{liabilities.length}]
          </h3>
          <div className="space-y-3">
            {liabilities.map(liability => (
              <div key={liability.id} className="p-3 bg-slate-50 dark:bg-gray-800 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: liabilityTypeColors[liability.type] }}
                    ></div>
                    <div>
                      <div className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                        {liability.name}
                      </div>
                      <div className="font-mono text-xs text-slate-500 dark:text-gray-400 uppercase">
                        {liability.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteLiability(liability.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-mono text-xs"
                  >
                    DELETE
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 font-mono">Balance:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={liability.balance}
                      onChange={(e) => updateLiabilityBalance(liability.id, parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 px-2 py-1 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-xs focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 font-mono">Rate:</span>
                    <div className="mt-1 font-mono text-slate-800 dark:text-white">
                      {liability.interestRate}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 font-mono">Min Payment:</span>
                    <div className="mt-1 font-mono text-slate-800 dark:text-white">
                      {formatCurrency(liability.minimumPayment)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 font-mono">Due:</span>
                    <div className="mt-1 font-mono text-slate-800 dark:text-white">
                      {new Date(liability.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}