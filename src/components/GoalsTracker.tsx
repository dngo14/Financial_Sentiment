'use client';

import { useState, useEffect } from 'react';
import { SavingsGoal } from '../lib/types';
import { TransactionManager } from '../lib/transactions';

export default function GoalsTracker() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    priority: 'medium' as SavingsGoal['priority'],
    category: 'other' as SavingsGoal['category'],
    monthlyContribution: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = () => {
    const savedGoals = localStorage.getItem('savings_goals');
    
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    } else {
      // Default goals
      const defaultGoals: SavingsGoal[] = [
        {
          id: '1',
          name: 'Emergency Fund',
          targetAmount: 15000,
          currentAmount: 8500,
          targetDate: '2025-06-01',
          priority: 'high',
          category: 'emergency',
          monthlyContribution: 500,
          isCompleted: false,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Hawaii Vacation',
          targetAmount: 5000,
          currentAmount: 1200,
          targetDate: '2025-08-01',
          priority: 'medium',
          category: 'vacation',
          monthlyContribution: 400,
          isCompleted: false,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'House Down Payment',
          targetAmount: 60000,
          currentAmount: 25000,
          targetDate: '2026-12-01',
          priority: 'high',
          category: 'house',
          monthlyContribution: 1500,
          isCompleted: false,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      ];
      setGoals(defaultGoals);
      localStorage.setItem('savings_goals', JSON.stringify(defaultGoals));
    }
  };

  const saveGoals = (updatedGoals: SavingsGoal[]) => {
    localStorage.setItem('savings_goals', JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
  };

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) return;

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: parseFloat(newGoal.currentAmount) || 0,
      targetDate: newGoal.targetDate,
      priority: newGoal.priority,
      category: newGoal.category,
      monthlyContribution: parseFloat(newGoal.monthlyContribution) || undefined,
      isCompleted: false,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const updatedGoals = [...goals, goal];
    saveGoals(updatedGoals);
    
    setNewGoal({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      priority: 'medium',
      category: 'other',
      monthlyContribution: ''
    });
    setShowAddGoal(false);
  };

  const updateGoalAmount = (id: string, newAmount: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal && newAmount > goal.currentAmount) {
      // Only add transaction if it's an increase (contribution)
      const contributionAmount = newAmount - goal.currentAmount;
      TransactionManager.addGoalContribution(
        goal.name,
        contributionAmount,
        goal.id
      );
    }
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === id) {
        const isCompleted = newAmount >= goal.targetAmount;
        return { 
          ...goal, 
          currentAmount: newAmount,
          isCompleted,
          lastUpdated: new Date().toISOString()
        };
      }
      return goal;
    });
    saveGoals(updatedGoals);
  };

  const deleteGoal = (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    saveGoals(updatedGoals);
  };

  const markAsCompleted = (id: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id 
        ? { ...goal, isCompleted: true, currentAmount: goal.targetAmount, lastUpdated: new Date().toISOString() }
        : goal
    );
    saveGoals(updatedGoals);
  };

  const calculateMonthsToGoal = (goal: SavingsGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    if (!goal.monthlyContribution || goal.monthlyContribution <= 0) return Infinity;
    
    return Math.ceil(remaining / goal.monthlyContribution);
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

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const completedGoals = goals.filter(goal => goal.isCompleted).length;
  const totalMonthlyContribution = goals.reduce((sum, goal) => sum + (goal.monthlyContribution || 0), 0);

  const categoryColors = {
    emergency: '#EF4444',
    vacation: '#3B82F6',
    house: '#10B981',
    car: '#8B5CF6',
    education: '#F59E0B',
    retirement: '#06B6D4',
    other: '#6B7280'
  };

  const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981'
  };

  return (
    <div className="space-y-6">
      {/* Goals Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            GOALS_&_SAVINGS_TRACKER
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
            >
              <option value="all">ALL CATEGORIES</option>
              <option value="emergency">EMERGENCY</option>
              <option value="vacation">VACATION</option>
              <option value="house">HOUSE</option>
              <option value="car">CAR</option>
              <option value="education">EDUCATION</option>
              <option value="retirement">RETIREMENT</option>
              <option value="other">OTHER</option>
            </select>
            <button
              onClick={() => setShowAddGoal(!showAddGoal)}
              className="px-4 py-2 font-mono text-sm border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition-all"
            >
              + ADD_GOAL
            </button>
          </div>
        </div>

        {/* Goals Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TOTAL SAVED</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(totalCurrentAmount)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TARGET AMOUNT</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white font-mono">
              {formatCurrency(totalTargetAmount)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">COMPLETED GOALS</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono">
              {completedGoals}/{goals.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY SAVINGS</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(totalMonthlyContribution)}
            </div>
          </div>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddGoal && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_SAVINGS_GOAL
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                GOAL NAME *
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                placeholder="New Car"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TARGET AMOUNT *
              </label>
              <input
                type="number"
                step="0.01"
                value={newGoal.targetAmount}
                onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                placeholder="25000.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CURRENT AMOUNT
              </label>
              <input
                type="number"
                step="0.01"
                value={newGoal.currentAmount}
                onChange={(e) => setNewGoal({...newGoal, currentAmount: e.target.value})}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                TARGET DATE *
              </label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CATEGORY
              </label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({...newGoal, category: e.target.value as SavingsGoal['category']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="emergency">EMERGENCY</option>
                <option value="vacation">VACATION</option>
                <option value="house">HOUSE</option>
                <option value="car">CAR</option>
                <option value="education">EDUCATION</option>
                <option value="retirement">RETIREMENT</option>
                <option value="other">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                PRIORITY
              </label>
              <select
                value={newGoal.priority}
                onChange={(e) => setNewGoal({...newGoal, priority: e.target.value as SavingsGoal['priority']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              >
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                MONTHLY CONTRIBUTION
              </label>
              <input
                type="number"
                step="0.01"
                value={newGoal.monthlyContribution}
                onChange={(e) => setNewGoal({...newGoal, monthlyContribution: e.target.value})}
                placeholder="500.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addGoal}
              disabled={!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newGoal.name || !newGoal.targetAmount || !newGoal.targetDate
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              ADD_GOAL
            </button>
            <button
              onClick={() => setShowAddGoal(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
              [ NO_GOALS_FOUND ]
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
              {selectedCategory === 'all' 
                ? 'Add your first savings goal to get started'
                : `No goals found in ${selectedCategory.toUpperCase()} category`
              }
            </div>
          </div>
        ) : (
          filteredGoals
            .sort((a, b) => {
              // Sort by priority first (high -> medium -> low), then by completion status, then by target date
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              }
              if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? 1 : -1;
              }
              return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
            })
            .map((goal) => {
              const progressPercentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const daysUntilTarget = getDaysUntilTarget(goal.targetDate);
              const monthsToGoal = calculateMonthsToGoal(goal);
              const isOverdue = daysUntilTarget < 0 && !goal.isCompleted;

              return (
                <div key={goal.id} className={`bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6 ${
                  goal.isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-700' : ''
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryColors[goal.category] }}
                      ></div>
                      <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                        {goal.name}
                        {goal.isCompleted && <span className="ml-2 text-green-600 dark:text-green-400">✓</span>}
                      </h3>
                      <span 
                        className="px-2 py-1 text-xs font-mono rounded-full text-white"
                        style={{ backgroundColor: priorityColors[goal.priority] }}
                      >
                        {goal.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-mono rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 uppercase">
                        {goal.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!goal.isCompleted && (
                        <button
                          onClick={() => markAsCompleted(goal.id)}
                          className="px-2 py-1 text-xs font-mono border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all rounded"
                        >
                          COMPLETE
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete goal "${goal.name}"?`)) {
                            deleteGoal(goal.id);
                          }
                        }}
                        className="px-2 py-1 text-xs font-mono border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all rounded"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">CURRENT AMOUNT</div>
                      <input
                        type="number"
                        step="0.01"
                        value={goal.currentAmount}
                        onChange={(e) => updateGoalAmount(goal.id, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                        disabled={goal.isCompleted}
                      />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TARGET AMOUNT</div>
                      <div className="text-lg font-bold text-slate-800 dark:text-white font-mono">
                        {formatCurrency(goal.targetAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">TARGET DATE</div>
                      <div className={`text-sm font-mono ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : daysUntilTarget <= 30
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {formatDate(goal.targetDate)}
                        <div className="text-xs">
                          ({isOverdue ? `${Math.abs(daysUntilTarget)}d overdue` : `${daysUntilTarget}d left`})
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY SAVINGS</div>
                      <div className="text-sm font-mono text-slate-800 dark:text-white">
                        {goal.monthlyContribution ? formatCurrency(goal.monthlyContribution) : 'Not set'}
                        {goal.monthlyContribution && monthsToGoal !== Infinity && (
                          <div className="text-xs text-slate-500 dark:text-gray-400">
                            ({monthsToGoal} months to goal)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                        PROGRESS: {progressPercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                        REMAINING: {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all flex items-center justify-center text-white text-xs font-mono ${
                          goal.isCompleted 
                            ? 'bg-green-500' 
                            : progressPercentage >= 75 
                            ? 'bg-emerald-500' 
                            : progressPercentage >= 50 
                            ? 'bg-blue-500' 
                            : progressPercentage >= 25
                            ? 'bg-yellow-500'
                            : 'bg-slate-500'
                        }`}
                        style={{ width: `${Math.max(10, progressPercentage)}%` }}
                      >
                        {progressPercentage >= 15 && `${progressPercentage.toFixed(0)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}