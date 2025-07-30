'use client';

import { useState, useEffect } from 'react';
import { BudgetCategory, BudgetTransaction } from '../lib/types';

export default function BudgetTracker() {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    budgetAmount: '',
    color: '#3B82F6',
    type: 'expense' as 'income' | 'expense'
  });

  const [editCategory, setEditCategory] = useState({
    name: '',
    budgetAmount: '',
    color: '#3B82F6',
    type: 'expense' as 'income' | 'expense'
  });

  const [newTransaction, setNewTransaction] = useState({
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense'
  });

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = () => {
    const savedCategories = localStorage.getItem('budget_categories');
    const savedTransactions = localStorage.getItem('budget_transactions');
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Default categories
      const defaultCategories: BudgetCategory[] = [
        { id: '1', name: 'Income', budgetAmount: 5000, spentAmount: 0, color: '#10B981', type: 'income' },
        { id: '2', name: 'Housing', budgetAmount: 1500, spentAmount: 0, color: '#EF4444', type: 'expense' },
        { id: '3', name: 'Food', budgetAmount: 600, spentAmount: 0, color: '#F59E0B', type: 'expense' },
        { id: '4', name: 'Transportation', budgetAmount: 400, spentAmount: 0, color: '#8B5CF6', type: 'expense' },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('budget_categories', JSON.stringify(defaultCategories));
    }
    
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  };

  const saveCategories = (updatedCategories: BudgetCategory[]) => {
    localStorage.setItem('budget_categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const saveTransactions = (updatedTransactions: BudgetTransaction[]) => {
    localStorage.setItem('budget_transactions', JSON.stringify(updatedTransactions));
    setTransactions(updatedTransactions);
  };

  const addCategory = () => {
    if (!newCategory.name || !newCategory.budgetAmount) return;

    const category: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      budgetAmount: parseFloat(newCategory.budgetAmount),
      spentAmount: 0,
      color: newCategory.color,
      type: newCategory.type
    };

    const updatedCategories = [...categories, category];
    saveCategories(updatedCategories);
    
    setNewCategory({
      name: '',
      budgetAmount: '',
      color: '#3B82F6',
      type: 'expense'
    });
    setShowAddCategory(false);
  };

  const startEditCategory = (category: BudgetCategory) => {
    // Close other forms first
    setShowAddCategory(false);
    setShowAddTransaction(false);
    
    setEditingCategory(category);
    setEditCategory({
      name: category.name,
      budgetAmount: category.budgetAmount.toString(),
      color: category.color,
      type: category.type
    });
    setShowEditCategory(true);
  };

  const updateCategory = () => {
    if (!editingCategory || !editCategory.name || !editCategory.budgetAmount) return;

    const updatedCategories = categories.map(cat => 
      cat.id === editingCategory.id 
        ? {
            ...cat,
            name: editCategory.name,
            budgetAmount: parseFloat(editCategory.budgetAmount),
            color: editCategory.color,
            type: editCategory.type
          }
        : cat
    );

    saveCategories(updatedCategories);
    
    setEditCategory({
      name: '',
      budgetAmount: '',
      color: '#3B82F6',
      type: 'expense'
    });
    setEditingCategory(null);
    setShowEditCategory(false);
  };

  const deleteCategory = (categoryId: string) => {
    // Remove all transactions for this category first
    const updatedTransactions = transactions.filter(t => t.categoryId !== categoryId);
    saveTransactions(updatedTransactions);

    // Remove the category
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    saveCategories(updatedCategories);
  };

  const addTransaction = () => {
    if (!newTransaction.categoryId || !newTransaction.amount || !newTransaction.description) return;

    const transaction: BudgetTransaction = {
      id: Date.now().toString(),
      categoryId: newTransaction.categoryId,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      date: newTransaction.date,
      type: newTransaction.type
    };

    const updatedTransactions = [...transactions, transaction];
    saveTransactions(updatedTransactions);

    // Update category spent amount
    const updatedCategories = categories.map(cat => {
      if (cat.id === newTransaction.categoryId) {
        const monthTransactions = getMonthTransactions(updatedTransactions, cat.id, selectedMonth);
        const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        return { ...cat, spentAmount: spent };
      }
      return cat;
    });
    saveCategories(updatedCategories);
    
    setNewTransaction({
      categoryId: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });
    setShowAddTransaction(false);
  };

  const deleteTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    saveTransactions(updatedTransactions);

    // Update category spent amounts
    const updatedCategories = categories.map(cat => {
      const monthTransactions = getMonthTransactions(updatedTransactions, cat.id, selectedMonth);
      const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, spentAmount: spent };
    });
    saveCategories(updatedCategories);
  };

  const getMonthTransactions = (allTransactions: BudgetTransaction[], categoryId: string, month: string) => {
    return allTransactions.filter(t => 
      t.categoryId === categoryId && 
      t.date.startsWith(month)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getMonthlyTotal = (type: 'income' | 'expense') => {
    return categories
      .filter(cat => cat.type === type)
      .reduce((total, cat) => {
        const monthTransactions = getMonthTransactions(transactions, cat.id, selectedMonth);
        const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
        return total + spent;
      }, 0);
  };

  const totalIncome = getMonthlyTotal('income');
  const totalExpenses = getMonthlyTotal('expense');
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Budget Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            BUDGET_TRACKER
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={() => {
                setShowAddCategory(!showAddCategory);
                if (showEditCategory) {
                  setShowEditCategory(false);
                  setEditingCategory(null);
                }
              }}
              className="px-4 py-2 font-mono text-sm border border-green-500 text-green-400 hover:bg-green-500/10 transition-all"
            >
              + ADD_CATEGORY
            </button>
            <button
              onClick={() => {
                setShowAddTransaction(!showAddTransaction);
                if (showEditCategory) {
                  setShowEditCategory(false);
                  setEditingCategory(null);
                }
              }}
              className="px-4 py-2 font-mono text-sm border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition-all"
            >
              + ADD_TRANSACTION
            </button>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">INCOME</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">EXPENSES</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NET INCOME</div>
            <div className={`text-2xl font-bold font-mono ${
              netIncome >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(netIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddCategory && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_CATEGORY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CATEGORY NAME *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Entertainment"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                BUDGET AMOUNT *
              </label>
              <input
                type="number"
                step="0.01"
                value={newCategory.budgetAmount}
                onChange={(e) => setNewCategory({...newCategory, budgetAmount: e.target.value})}
                placeholder="300.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TYPE
              </label>
              <select
                value={newCategory.type}
                onChange={(e) => setNewCategory({...newCategory, type: e.target.value as 'income' | 'expense'})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="expense">EXPENSE</option>
                <option value="income">INCOME</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                COLOR
              </label>
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                className="w-full h-10 border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addCategory}
              disabled={!newCategory.name || !newCategory.budgetAmount}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newCategory.name || !newCategory.budgetAmount
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-green-500 text-green-400 hover:bg-green-500/10'
              }`}
            >
              ADD_CATEGORY
            </button>
            <button
              onClick={() => setShowAddCategory(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Edit Category Form */}
      {showEditCategory && editingCategory && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            EDIT_CATEGORY: {editingCategory.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CATEGORY NAME *
              </label>
              <input
                type="text"
                value={editCategory.name}
                onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                placeholder="Entertainment"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                BUDGET AMOUNT *
              </label>
              <input
                type="number"
                step="0.01"
                value={editCategory.budgetAmount}
                onChange={(e) => setEditCategory({...editCategory, budgetAmount: e.target.value})}
                placeholder="300.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TYPE
              </label>
              <select
                value={editCategory.type}
                onChange={(e) => setEditCategory({...editCategory, type: e.target.value as 'income' | 'expense'})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-yellow-400"
              >
                <option value="expense">EXPENSE</option>
                <option value="income">INCOME</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                COLOR
              </label>
              <input
                type="color"
                value={editCategory.color}
                onChange={(e) => setEditCategory({...editCategory, color: e.target.value})}
                className="w-full h-10 border border-slate-300 dark:border-gray-600 rounded focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={updateCategory}
              disabled={!editCategory.name || !editCategory.budgetAmount}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !editCategory.name || !editCategory.budgetAmount
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/10'
              }`}
            >
              UPDATE_CATEGORY
            </button>
            <button
              onClick={() => {
                setShowEditCategory(false);
                setEditingCategory(null);
              }}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Add Transaction Form */}
      {showAddTransaction && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_TRANSACTION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CATEGORY *
              </label>
              <select
                value={newTransaction.categoryId}
                onChange={(e) => {
                  const selectedCategory = categories.find(cat => cat.id === e.target.value);
                  setNewTransaction({
                    ...newTransaction, 
                    categoryId: e.target.value,
                    type: selectedCategory?.type || 'expense'
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                AMOUNT *
              </label>
              <input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                placeholder="50.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DESCRIPTION *
              </label>
              <input
                type="text"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                placeholder="Grocery shopping"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DATE
              </label>
              <input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addTransaction}
              disabled={!newTransaction.categoryId || !newTransaction.amount || !newTransaction.description}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newTransaction.categoryId || !newTransaction.amount || !newTransaction.description
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-blue-500 text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              ADD_TRANSACTION
            </button>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Budget Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(category => {
          const monthTransactions = getMonthTransactions(transactions, category.id, selectedMonth);
          const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
          const remaining = category.budgetAmount - spent;
          const percentage = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0;

          return (
            <div key={category.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                    {category.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-mono rounded-full ${
                    category.type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {category.type.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditCategory(category)}
                    className="px-2 py-1 text-xs font-mono border border-yellow-500 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10 transition-all rounded"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete category "${category.name}" and all its transactions?`)) {
                        deleteCategory(category.id);
                      }
                    }}
                    className="px-2 py-1 text-xs font-mono border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all rounded"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-600 dark:text-gray-400">Budget:</span>
                  <span className="text-sm font-mono text-slate-800 dark:text-white">{formatCurrency(category.budgetAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-600 dark:text-gray-400">Spent:</span>
                  <span className={`text-sm font-mono ${
                    category.type === 'expense' && spent > category.budgetAmount 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-slate-800 dark:text-white'
                  }`}>
                    {formatCurrency(spent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-mono text-slate-600 dark:text-gray-400">Remaining:</span>
                  <span className={`text-sm font-mono ${
                    remaining >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      percentage > 100 
                        ? 'bg-red-500' 
                        : percentage > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs font-mono text-slate-500 dark:text-gray-400">
                  {percentage.toFixed(1)}% used
                </div>
              </div>

              {/* Recent Transactions */}
              {monthTransactions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                  <h4 className="text-sm font-mono font-bold text-slate-800 dark:text-white mb-2">
                    RECENT TRANSACTIONS
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {monthTransactions.slice(-3).map(transaction => (
                      <div key={transaction.id} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-600 dark:text-gray-400 truncate">
                          {transaction.description}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-800 dark:text-white">
                            {formatCurrency(transaction.amount)}
                          </span>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}