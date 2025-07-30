import { Transaction } from './types';

export class TransactionManager {
  private static STORAGE_KEY = 'financial_transactions';

  static getTransactions(): Transaction[] {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  }

  static saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
  }

  static addTransaction(transaction: Omit<Transaction, 'id' | 'createdDate'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdDate: new Date().toISOString()
    };

    const transactions = this.getTransactions();
    transactions.push(newTransaction);
    this.saveTransactions(transactions);

    return newTransaction;
  }

  static removeTransaction(id: string): void {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    this.saveTransactions(filtered);
  }

  static updateTransaction(id: string, updates: Partial<Transaction>): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updates };
      this.saveTransactions(transactions);
    }
  }

  static getTransactionsByCategory(category: Transaction['category']): Transaction[] {
    return this.getTransactions().filter(t => t.category === category);
  }

  static getTransactionsByDateRange(startDate: string, endDate: string): Transaction[] {
    return this.getTransactions().filter(t => {
      const transactionDate = new Date(t.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    });
  }

  static getTransactionsByMonth(year: number, month: number): Transaction[] {
    return this.getTransactions().filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
  }

  // Helper methods for specific transaction types
  static addStockTransaction(
    type: 'buy' | 'sell',
    symbol: string,
    quantity: number,
    price: number,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type,
      category: 'portfolio',
      description: `${type.toUpperCase()} ${quantity} shares of ${symbol}`,
      amount: quantity * price,
      date,
      relatedName: symbol,
      metadata: {
        symbol,
        quantity,
        price
      }
    });
  }

  static addBillPayment(
    billName: string,
    amount: number,
    billId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type: 'bill_payment',
      category: 'bills',
      description: `Payment for ${billName}`,
      amount,
      date,
      relatedId: billId,
      relatedName: billName,
      metadata: {
        billName
      }
    });
  }

  static addGoalContribution(
    goalName: string,
    amount: number,
    goalId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type: 'goal_contribution',
      category: 'goals',
      description: `Contribution to ${goalName}`,
      amount,
      date,
      relatedId: goalId,
      relatedName: goalName,
      metadata: {
        goalName
      }
    });
  }

  static addBudgetTransaction(
    categoryName: string,
    description: string,
    amount: number,
    type: 'budget_transaction',
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type,
      category: 'budget',
      description,
      amount,
      date,
      relatedName: categoryName,
      metadata: {
        categoryName
      }
    });
  }

  static addDebtPayment(
    debtName: string,
    amount: number,
    debtId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type: 'debt_payment',
      category: 'debt',
      description: `Payment to ${debtName}`,
      amount,
      date,
      relatedId: debtId,
      relatedName: debtName
    });
  }

  static addCreditPayment(
    cardName: string,
    amount: number,
    cardId: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type: 'credit_payment',
      category: 'credit',
      description: `Payment to ${cardName}`,
      amount,
      date,
      relatedId: cardId,
      relatedName: cardName
    });
  }

  static addDividend(
    symbol: string,
    amount: number,
    date: string = new Date().toISOString().split('T')[0]
  ): Transaction {
    return this.addTransaction({
      type: 'dividend',
      category: 'portfolio',
      description: `Dividend from ${symbol}`,
      amount,
      date,
      relatedName: symbol,
      metadata: {
        symbol
      }
    });
  }
}