export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  timestamp: number;
  url?: string;
  summary?: string;
  sentimentScore?: number; // 1-10 scale
  tickers?: string[];
  type?: 'news' | 'social'; // Distinguish between news articles and X/social posts
  apiSource?: string; // Which API was used (e.g., 'finnhub', 'marketaux', 'newsapi', 'rss-feeds', 'social-rss', 'twitter-realistic', 'mock')
  category?: string; // Content category
}

export interface SentimentAnalysis {
  score: number;
  summary: string;
  tickers: string[];
}

export interface NewsSource {
  name: string;
  url: string;
  type: 'rss' | 'api';
}

export interface PaginatedFeed {
  items: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface SeparatedFeeds {
  news: NewsItem[];
  social: NewsItem[];
}

export interface PaginatedSeparatedFeeds {
  news: PaginatedFeed;
  social: PaginatedFeed;
}

// Polygon.io Types
export interface PolygonFinancials {
  ticker: string;
  cik: string;
  company_name: string;
  start_date: string;
  end_date: string;
  filing_date: string;
  acceptance_datetime: string;
  timeframe: string;
  fiscal_period: string;
  fiscal_year: string;
  financials: {
    balance_sheet?: {
      equity?: {
        value: number;
      };
      assets?: {
        value: number;
      };
      liabilities?: {
        value: number;
      };
    };
    income_statement?: {
      revenues?: {
        value: number;
      };
      net_income_loss?: {
        value: number;
      };
      gross_profit?: {
        value: number;
      };
    };
    cash_flow_statement?: {
      net_cash_flow?: {
        value: number;
      };
      net_cash_flow_from_operating_activities?: {
        value: number;
      };
    };
  };
}

export interface PolygonNews {
  id: string;
  publisher: {
    name: string;
    homepage_url?: string;
    logo_url?: string;
    favicon_url?: string;
  };
  title: string;
  author?: string;
  published_utc: string;
  article_url: string;
  tickers?: string[];
  amp_url?: string;
  image_url?: string;
  description?: string;
  keywords?: string[];
}

export interface PolygonCompanyOverview {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik?: string;
  composite_figi?: string;
  share_class_figi?: string;
  market_cap?: number;
  phone_number?: string;
  address?: {
    address1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  description?: string;
  sic_code?: string;
  sic_description?: string;
  ticker_root?: string;
  homepage_url?: string;
  total_employees?: number;
  list_date?: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
}

export interface PolygonStockPrice {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: [{
    T: string; // ticker
    v: number; // volume
    vw: number; // volume weighted average price
    o: number; // open
    c: number; // close
    h: number; // high
    l: number; // low
    t: number; // timestamp
    n: number; // number of transactions
  }];
  status: string;
  request_id: string;
  count: number;
}

export interface CompanyData {
  ticker: string;
  type: 'financials' | 'news' | 'overview' | 'price';
  data: PolygonFinancials[] | PolygonNews[] | PolygonCompanyOverview | PolygonStockPrice;
  count: number;
  next_url?: string;
}

// Financial Hub Types
export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  lastUpdated: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
  color: string;
  type: 'income' | 'expense';
}

export interface BudgetTransaction {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
}

export interface Asset {
  id: string;
  name: string;
  type: 'property' | 'vehicle' | 'investment' | 'cash' | 'other';
  value: number;
  lastUpdated: string;
}

export interface Liability {
  id: string;
  name: string;
  type: 'mortgage' | 'loan' | 'credit_card' | 'other';
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  lastUpdated: string;
}

export interface DebtAccount {
  id: string;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'student_loan' | 'other';
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  creditLimit?: number;
  lastUpdated: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  balance: number;
  creditLimit: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  lastPayment?: {
    amount: number;
    date: string;
  };
  lastUpdated: string;
}

export interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // prev close
}

// Goals & Savings Types
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'retirement' | 'other';
  monthlyContribution?: number;
  isCompleted: boolean;
  createdDate: string;
  lastUpdated: string;
}

// Bill Tracker Types
export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // day of month (1-31)
  frequency: 'monthly' | 'quarterly' | 'annually' | 'weekly';
  category: 'housing' | 'utilities' | 'insurance' | 'subscriptions' | 'loans' | 'other';
  isAutoPay: boolean;
  isPaid: boolean;
  lastPaidDate?: string;
  nextDueDate: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring: boolean;
  createdDate: string;
  lastUpdated: string;
}

// Dashboard Types
export interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNetIncome: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  creditUtilization: number;
  emergencyFundMonths: number;
}

// Transaction History Types
export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'dividend' | 'bill_payment' | 'goal_contribution' | 'budget_transaction' | 'debt_payment' | 'credit_payment' | 'transfer' | 'fee';
  category: 'portfolio' | 'budget' | 'goals' | 'bills' | 'debt' | 'credit' | 'transfer';
  description: string;
  amount: number;
  date: string;
  relatedId?: string; // ID of related item (stock holding, bill, goal, etc.)
  relatedName?: string; // Name for display (stock symbol, bill name, etc.)
  metadata?: {
    symbol?: string;
    quantity?: number;
    price?: number;
    goalName?: string;
    billName?: string;
    categoryName?: string;
    fromAccount?: string;
    toAccount?: string;
  };
  createdDate: string;
}

// Options Trading Types
export interface OptionPosition {
  id: string;
  symbol: string; // Underlying stock symbol
  contractSymbol: string; // Full options contract symbol
  type: 'call' | 'put';
  action: 'buy' | 'sell'; // Buy to open, sell to open, buy to close, sell to close
  strategy: 'long_call' | 'long_put' | 'short_call' | 'short_put' | 'covered_call' | 'protective_put' | 'spread' | 'other';
  strikePrice: number;
  expirationDate: string;
  quantity: number; // Number of contracts
  premium: number; // Premium per contract
  totalPremium: number; // Total premium paid/received
  currentPrice: number;
  purchaseDate: string;
  isOpen: boolean;
  closeDate?: string;
  closePrice?: number;
  profitLoss?: number;
  impliedVolatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  lastUpdated: string;
}

// Analytics Types
export interface SpendingAnalytics {
  totalSpent: number;
  categoryBreakdown: { [category: string]: number };
  monthlyTrends: { [month: string]: number };
  averageMonthlySpending: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  spendingGrowth: number; // Month over month percentage change
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  bestPerformer: { symbol: string; gainLoss: number; gainLossPercent: number };
  worstPerformer: { symbol: string; gainLoss: number; gainLossPercent: number };
  sectorAllocation: { [sector: string]: number };
  assetAllocation: { stocks: number; options: number; cash: number };
}