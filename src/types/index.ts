export interface Trade {
  id: string;
  name?: string;
  cryptocurrency: string;
  coinId: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  quantityType: 'coins' | 'dollars';
  stopLoss: number;
  entryDate: string;
  exitDate?: string;
  notes?: string;
  lessonsLearned?: string;
  isActive: boolean;
  partialExits?: PartialExit[];
  remainingQuantity?: number;
  originalQuantity?: number;
  isTrailingStop?: boolean;
  trailingAmount?: number;
  trailingType?: 'percentage' | 'fixed';
  highestPrice?: number;
  lowestPrice?: number;
  fees?: number; // Trading fees as a percentage
  feesType?: 'percentage' | 'fixed'; // Whether fees are a percentage or fixed dollar amount
}

export interface PartialExit {
  id: string;
  exitDate: string;
  exitPrice: number;
  exitQuantity: number;
  notes?: string;
  fees?: number; // Trading fees as a percentage
  feesType?: 'percentage' | 'fixed'; // Whether fees are a percentage or fixed dollar amount
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  averageR: number;
}

export interface BitcoinComparison {
  tradingProfit: number;
  holdingProfit: number;
  difference: number;
  percentageDifference: number;
  period: TimePeriod;
  yearStartBalance?: number;
  monthStartBalance?: number;
  quarterStartBalance?: number;
  allTimeStartBalance?: number;
  startBalance: number;
  isFullPeriod: boolean;
  actualStartDate: string;
}

export type TimePeriod = 'all' | 'month' | 'quarter' | 'year';

export interface PortfolioPerformance {
  date: string;
  portfolioValue: number;
  cumulativeProfit: number;
  tradeCount: number;
}

export interface PortfolioSettings {
  startDate: string;
  initialBalance: number;
} 