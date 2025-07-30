'use client';

import { useState, useEffect } from 'react';
import { Bill } from '../lib/types';
import { TransactionManager } from '../lib/transactions';

export default function BillTracker() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showAddBill, setShowAddBill] = useState(false);
  const [selectedView, setSelectedView] = useState<'upcoming' | 'all' | 'overdue'>('upcoming');
  
  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    dueDate: '1',
    frequency: 'monthly' as Bill['frequency'],
    category: 'utilities' as Bill['category'],
    isAutoPay: false,
    paymentMethod: '',
    notes: ''
  });

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = () => {
    const savedBills = localStorage.getItem('bills');
    
    if (savedBills) {
      setBills(JSON.parse(savedBills));
    } else {
      // Default bills
      const defaultBills: Bill[] = [
        {
          id: '1',
          name: 'Rent',
          amount: 1500,
          dueDate: '1',
          frequency: 'monthly',
          category: 'housing',
          isAutoPay: true,
          isPaid: false,
          nextDueDate: getNextDueDate('1', 'monthly'),
          paymentMethod: 'Bank Transfer',
          isRecurring: true,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Electric Bill',
          amount: 120,
          dueDate: '15',
          frequency: 'monthly',
          category: 'utilities',
          isAutoPay: false,
          isPaid: false,
          nextDueDate: getNextDueDate('15', 'monthly'),
          paymentMethod: 'Credit Card',
          isRecurring: true,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Internet',
          amount: 80,
          dueDate: '20',
          frequency: 'monthly',
          category: 'utilities',
          isAutoPay: true,
          isPaid: false,
          nextDueDate: getNextDueDate('20', 'monthly'),
          paymentMethod: 'Credit Card',
          isRecurring: true,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Car Insurance',
          amount: 180,
          dueDate: '5',
          frequency: 'monthly',
          category: 'insurance',
          isAutoPay: true,
          isPaid: false,
          nextDueDate: getNextDueDate('5', 'monthly'),
          paymentMethod: 'Bank Transfer',
          isRecurring: true,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      ];
      setBills(defaultBills);
      localStorage.setItem('bills', JSON.stringify(defaultBills));
    }
  };

  const saveBills = (updatedBills: Bill[]) => {
    localStorage.setItem('bills', JSON.stringify(updatedBills));
    setBills(updatedBills);
  };

  const addBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.dueDate) return;

    const bill: Bill = {
      id: Date.now().toString(),
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      dueDate: newBill.dueDate,
      frequency: newBill.frequency,
      category: newBill.category,
      isAutoPay: newBill.isAutoPay,
      isPaid: false,
      nextDueDate: getNextDueDate(newBill.dueDate, newBill.frequency),
      paymentMethod: newBill.paymentMethod || undefined,
      notes: newBill.notes || undefined,
      isRecurring: true,
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const updatedBills = [...bills, bill];
    saveBills(updatedBills);
    
    setNewBill({
      name: '',
      amount: '',
      dueDate: '1',
      frequency: 'monthly',
      category: 'utilities',
      isAutoPay: false,
      paymentMethod: '',
      notes: ''
    });
    setShowAddBill(false);
  };

  const markAsPaid = (id: string) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === id) {
        const nextDue = getNextDueDate(bill.dueDate, bill.frequency);
        
        // Add transaction record for bill payment
        TransactionManager.addBillPayment(
          bill.name,
          bill.amount,
          bill.id
        );
        
        return { 
          ...bill, 
          isPaid: true,
          lastPaidDate: new Date().toISOString(),
          nextDueDate: nextDue,
          lastUpdated: new Date().toISOString()
        };
      }
      return bill;
    });
    
    // Reset isPaid status for next cycle
    setTimeout(() => {
      const resetBills = updatedBills.map(bill => 
        bill.id === id ? { ...bill, isPaid: false } : bill
      );
      saveBills(resetBills);
    }, 1000);
    
    saveBills(updatedBills);
  };

  const deleteBill = (id: string) => {
    const updatedBills = bills.filter(b => b.id !== id);
    saveBills(updatedBills);
  };

  const updateBillAmount = (id: string, newAmount: number) => {
    const updatedBills = bills.map(bill => 
      bill.id === id 
        ? { ...bill, amount: newAmount, lastUpdated: new Date().toISOString() }
        : bill
    );
    saveBills(updatedBills);
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

  const getDaysUntilDue = (nextDueDate: string) => {
    const due = new Date(nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilteredBills = () => {
    switch (selectedView) {
      case 'upcoming':
        return bills.filter(bill => {
          const daysUntil = getDaysUntilDue(bill.nextDueDate);
          return daysUntil >= 0 && daysUntil <= 30 && !bill.isPaid;
        });
      case 'overdue':
        return bills.filter(bill => {
          const daysUntil = getDaysUntilDue(bill.nextDueDate);
          return daysUntil < 0 && !bill.isPaid;
        });
      case 'all':
      default:
        return bills;
    }
  };

  const totalMonthlyBills = bills.reduce((sum, bill) => {
    if (bill.frequency === 'monthly') return sum + bill.amount;
    if (bill.frequency === 'quarterly') return sum + (bill.amount / 3);
    if (bill.frequency === 'annually') return sum + (bill.amount / 12);
    if (bill.frequency === 'weekly') return sum + (bill.amount * 4.33);
    return sum;
  }, 0);

  const upcomingBills = bills.filter(bill => {
    const daysUntil = getDaysUntilDue(bill.nextDueDate);
    return daysUntil >= 0 && daysUntil <= 7 && !bill.isPaid;
  });

  const overdueBills = bills.filter(bill => {
    const daysUntil = getDaysUntilDue(bill.nextDueDate);
    return daysUntil < 0 && !bill.isPaid;
  });

  const autoPayBills = bills.filter(bill => bill.isAutoPay).length;

  const categoryColors = {
    housing: '#10B981',
    utilities: '#3B82F6',
    insurance: '#8B5CF6',
    subscriptions: '#F59E0B',
    loans: '#EF4444',
    other: '#6B7280'
  };

  return (
    <div className="space-y-6">
      {/* Bills Header */}
      <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
            BILL_TRACKER_&_REMINDERS
          </h2>
          <div className="flex items-center gap-3">
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value as 'upcoming' | 'all' | 'overdue')}
              className="px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="upcoming">UPCOMING (30 DAYS)</option>
              <option value="overdue">OVERDUE</option>
              <option value="all">ALL BILLS</option>
            </select>
            <button
              onClick={() => setShowAddBill(!showAddBill)}
              className="px-4 py-2 font-mono text-sm border border-orange-500 text-orange-400 hover:bg-orange-500/10 transition-all"
            >
              + ADD_BILL
            </button>
          </div>
        </div>

        {/* Bills Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">MONTHLY TOTAL</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
              {formatCurrency(totalMonthlyBills)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">DUE THIS WEEK</div>
            <div className={`text-2xl font-bold font-mono ${
              upcomingBills.length > 0 
                ? 'text-yellow-600 dark:text-yellow-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {upcomingBills.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">OVERDUE</div>
            <div className={`text-2xl font-bold font-mono ${
              overdueBills.length > 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-green-600 dark:text-green-400'
            }`}>
              {overdueBills.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AUTO-PAY ENABLED</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {autoPayBills}/{bills.length}
            </div>
          </div>
        </div>
      </div>

      {/* Add Bill Form */}
      {showAddBill && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-white mb-4">
            ADD_NEW_BILL
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                BILL NAME *
              </label>
              <input
                type="text"
                value={newBill.name}
                onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                placeholder="Netflix Subscription"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                AMOUNT *
              </label>
              <input
                type="number"
                step="0.01"
                value={newBill.amount}
                onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                placeholder="15.99"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                DUE DATE (DAY OF MONTH) *
              </label>
              <select
                value={newBill.dueDate}
                onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              >
                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                  <option key={day} value={day.toString()}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                FREQUENCY
              </label>
              <select
                value={newBill.frequency}
                onChange={(e) => setNewBill({...newBill, frequency: e.target.value as Bill['frequency']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              >
                <option value="weekly">WEEKLY</option>
                <option value="monthly">MONTHLY</option>
                <option value="quarterly">QUARTERLY</option>
                <option value="annually">ANNUALLY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                CATEGORY
              </label>
              <select
                value={newBill.category}
                onChange={(e) => setNewBill({...newBill, category: e.target.value as Bill['category']})}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              >
                <option value="housing">HOUSING</option>
                <option value="utilities">UTILITIES</option>
                <option value="insurance">INSURANCE</option>
                <option value="subscriptions">SUBSCRIPTIONS</option>
                <option value="loans">LOANS</option>
                <option value="other">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                PAYMENT METHOD
              </label>
              <input
                type="text"
                value={newBill.paymentMethod}
                onChange={(e) => setNewBill({...newBill, paymentMethod: e.target.value})}
                placeholder="Credit Card"
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-mono text-slate-600 dark:text-gray-400 mb-2">
                NOTES
              </label>
              <input
                type="text"
                value={newBill.notes}
                onChange={(e) => setNewBill({...newBill, notes: e.target.value})}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newBill.isAutoPay}
                  onChange={(e) => setNewBill({...newBill, isAutoPay: e.target.checked})}
                  className="rounded"
                />
                <span className="text-xs font-mono text-slate-600 dark:text-gray-400">
                  ENABLE AUTO-PAY
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={addBill}
              disabled={!newBill.name || !newBill.amount || !newBill.dueDate}
              className={`px-4 py-2 font-mono text-sm border transition-all ${
                !newBill.name || !newBill.amount || !newBill.dueDate
                  ? 'border-gray-400 text-gray-500 cursor-not-allowed'
                  : 'border-orange-500 text-orange-400 hover:bg-orange-500/10'
              }`}
            >
              ADD_BILL
            </button>
            <button
              onClick={() => setShowAddBill(false)}
              className="px-4 py-2 font-mono text-sm border border-gray-500 text-gray-400 hover:bg-gray-500/10 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Bills List */}
      <div className="space-y-4">
        {getFilteredBills().length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <div className="text-slate-600 dark:text-gray-400 font-mono text-lg mb-2">
              [ NO_BILLS_FOUND ]
            </div>
            <div className="text-slate-500 dark:text-gray-500 font-mono text-sm">
              {selectedView === 'upcoming' && 'No bills due in the next 30 days'}
              {selectedView === 'overdue' && 'No overdue bills'}
              {selectedView === 'all' && 'Add your first bill to get started'}
            </div>
          </div>
        ) : (
          getFilteredBills()
            .sort((a, b) => {
              const aDays = getDaysUntilDue(a.nextDueDate);
              const bDays = getDaysUntilDue(b.nextDueDate);
              // Sort overdue first (negative days), then by days until due
              if (aDays < 0 && bDays >= 0) return -1;
              if (bDays < 0 && aDays >= 0) return 1;
              return aDays - bDays;
            })
            .map((bill) => {
              const daysUntilDue = getDaysUntilDue(bill.nextDueDate);
              const isOverdue = daysUntilDue < 0;
              const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

              return (
                <div key={bill.id} className={`bg-white dark:bg-gray-900 border rounded-lg p-6 ${
                  isOverdue 
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
                    : isDueSoon
                    ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
                    : 'border-slate-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoryColors[bill.category] }}
                      ></div>
                      <h3 className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                        {bill.name}
                      </h3>
                      {bill.isAutoPay && (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          AUTO-PAY
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs font-mono rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 uppercase">
                        {bill.category}
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          OVERDUE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!bill.isPaid && (
                        <button
                          onClick={() => markAsPaid(bill.id)}
                          className="px-3 py-1 text-xs font-mono border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-all rounded"
                        >
                          MARK PAID
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete bill "${bill.name}"?`)) {
                            deleteBill(bill.id);
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
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">AMOUNT</div>
                      <input
                        type="number"
                        step="0.01"
                        value={bill.amount}
                        onChange={(e) => updateBillAmount(bill.id, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-black text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">NEXT DUE</div>
                      <div className={`text-lg font-bold font-mono ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : isDueSoon
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {formatDate(bill.nextDueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">FREQUENCY</div>
                      <div className="text-sm font-mono text-slate-800 dark:text-white uppercase">
                        {bill.frequency}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 font-mono mb-1">DAYS UNTIL DUE</div>
                      <div className={`text-lg font-bold font-mono ${
                        isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : isDueSoon
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-slate-800 dark:text-white'
                      }`}>
                        {isOverdue ? `${Math.abs(daysUntilDue)} OVERDUE` : `${daysUntilDue} DAYS`}
                      </div>
                    </div>
                  </div>

                  {(bill.paymentMethod || bill.notes) && (
                    <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {bill.paymentMethod && (
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">PAYMENT METHOD:</span>
                            <div className="font-mono text-slate-800 dark:text-white">{bill.paymentMethod}</div>
                          </div>
                        )}
                        {bill.notes && (
                          <div>
                            <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">NOTES:</span>
                            <div className="font-mono text-slate-800 dark:text-white">{bill.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {bill.lastPaidDate && (
                    <div className="mt-2 text-xs font-mono text-green-600 dark:text-green-400">
                      Last paid: {formatDate(bill.lastPaidDate)}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}

// Helper function to calculate next due date
function getNextDueDate(dueDate: string, frequency: Bill['frequency']): string {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const dueDateNum = parseInt(dueDate);
  
  let nextDue = new Date(currentYear, currentMonth, dueDateNum);
  
  // If the due date has passed this month, move to next period
  if (nextDue <= today) {
    switch (frequency) {
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + 3);
        break;
      case 'annually':
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        break;
    }
  }
  
  return nextDue.toISOString().split('T')[0];
}