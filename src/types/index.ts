export interface Trade {
  id: string;
  cryptocurrency: string;
  coinId: string;
  entryPrice: number;
  quantity: number;
  quantityType: 'coins' | 'dollars';
  stopLoss: number;
  entryDate: string;
  exitDate?: string;
  exitPrice?: number;
  notes?: string;
  isActive: boolean;
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
}

export interface BitcoinComparison {
  tradingProfit: number;
  holdingProfit: number;
  difference: number;
  percentageDifference: number;
  period: 'all' | 'month' | 'quarter' | 'year';
  yearStartBalance?: number;
}

export type TimePeriod = 'all' | 'month' | 'quarter' | 'year'; 