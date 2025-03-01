import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Trade, TradeStats, BitcoinComparison, TimePeriod } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'isActive'>) => void;
  updateTrade: (trade: Trade) => void;
  closeTrade: (id: string, exitPrice: number) => void;
  updateStopLoss: (id: string, newStopLoss: number) => void;
  deleteTrade: (id: string) => void;
  importTrades: (trades: Trade[]) => void;
  calculateRisk: (entryPrice: number, stopLoss: number, quantity: number, quantityType: 'coins' | 'dollars', portfolioValue: number, isShort: boolean) => number;
  getTradeStats: () => TradeStats;
  getBitcoinComparison: (period?: TimePeriod) => BitcoinComparison;
  portfolioValue: number;
  setPortfolioValue: (value: number) => void;
  yearStartBalance: number;
  setYearStartBalance: (value: number) => void;
  calculatePositionFromRisk: (
    entryPrice: number, 
    stopLoss: number, 
    desiredRiskPercent: number, 
    portfolioValue: number, 
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => number;
  calculateStopLossFromRisk: (
    entryPrice: number,
    quantity: number,
    desiredRiskPercent: number,
    portfolioValue: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => number;
  calculatePositionFromDollarRisk: (
    entryPrice: number,
    stopLoss: number,
    dollarRiskAmount: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => number;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  return context;
};

interface TradeProviderProps {
  children: ReactNode;
}

export const TradeProvider: React.FC<TradeProviderProps> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>(() => {
    const savedTrades = localStorage.getItem('trades');
    return savedTrades ? JSON.parse(savedTrades) : [];
  });
  
  const [portfolioValue, setPortfolioValue] = useState<number>(() => {
    const savedValue = localStorage.getItem('portfolioValue');
    return savedValue ? parseFloat(savedValue) : 10000;
  });

  const [yearStartBalance, setYearStartBalance] = useState<number>(() => {
    const savedValue = localStorage.getItem('yearStartBalance');
    return savedValue ? parseFloat(savedValue) : portfolioValue;
  });

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('portfolioValue', portfolioValue.toString());
  }, [portfolioValue]);

  useEffect(() => {
    localStorage.setItem('yearStartBalance', yearStartBalance.toString());
  }, [yearStartBalance]);

  const addTrade = (trade: Omit<Trade, 'id' | 'isActive'>) => {
    const newTrade: Trade = {
      ...trade,
      id: uuidv4(),
      isActive: true,
    };
    setTrades([...trades, newTrade]);
  };

  const updateTrade = (updatedTrade: Trade) => {
    setTrades(trades.map(trade => 
      trade.id === updatedTrade.id ? updatedTrade : trade
    ));
  };

  const closeTrade = (id: string, exitPrice: number) => {
    setTrades(trades.map(trade => 
      trade.id === id 
        ? { 
            ...trade, 
            isActive: false, 
            exitPrice, 
            exitDate: new Date().toISOString() 
          } 
        : trade
    ));
  };

  const updateStopLoss = (id: string, newStopLoss: number) => {
    setTrades(trades.map(trade => 
      trade.id === id ? { ...trade, stopLoss: newStopLoss } : trade
    ));
  };

  const deleteTrade = (id: string) => {
    setTrades(trades.filter(trade => trade.id !== id));
  };

  const importTrades = (importedTrades: Trade[]) => {
    // Ensure all imported trades have valid IDs
    const tradesWithIds = importedTrades.map(trade => ({
      ...trade,
      id: trade.id || uuidv4() // Use existing ID or generate a new one
    }));
    
    // Merge with existing trades, avoiding duplicates by ID
    const existingIds = new Set(trades.map(trade => trade.id));
    const newTrades = tradesWithIds.filter(trade => !existingIds.has(trade.id));
    
    setTrades([...trades, ...newTrades]);
  };

  const calculateRisk = (entryPrice: number, stopLoss: number, quantity: number, quantityType: 'coins' | 'dollars', portfolioValue: number, isShort: boolean = false) => {
    if (portfolioValue <= 0) return 0; // Avoid division by zero
    
    // For dollar-based positions, we need to calculate how many coins that represents
    const actualQuantity = quantityType === 'dollars' ? quantity / entryPrice : quantity;
    
    // Calculate the price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    // Calculate the actual dollar amount at risk
    const dollarValueAtRisk = priceChange * actualQuantity;
    
    // Calculate risk as percentage of portfolio
    return (dollarValueAtRisk / portfolioValue) * 100;
  };

  const calculatePositionFromRisk = (
    entryPrice: number, 
    stopLoss: number, 
    desiredRiskPercent: number, 
    portfolioValue: number, 
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => {
    if (portfolioValue <= 0 || desiredRiskPercent <= 0) return 0; // Avoid invalid inputs
    
    // Calculate the maximum dollar amount to risk based on desired risk percentage
    const maxRiskAmount = (desiredRiskPercent / 100) * portfolioValue;
    
    // Calculate price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    if (priceChange === 0) return 0; // Avoid division by zero
    
    // Calculate the position size in coins
    const positionSizeCoins = maxRiskAmount / priceChange;
    
    // Return either coins or dollar equivalent based on quantityType
    return quantityType === 'coins' 
      ? positionSizeCoins 
      : positionSizeCoins * entryPrice;
  };

  const calculateStopLossFromRisk = (
    entryPrice: number,
    quantity: number,
    desiredRiskPercent: number,
    portfolioValue: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => {
    if (portfolioValue <= 0 || desiredRiskPercent <= 0) return entryPrice; // Return entry price for invalid inputs
    
    // Calculate the maximum dollar amount to risk based on desired risk percentage
    const maxRiskAmount = (desiredRiskPercent / 100) * portfolioValue;
    
    // Calculate actual quantity in coins if input is in dollars
    const actualQuantity = quantityType === 'dollars' ? quantity / entryPrice : quantity;
    
    if (actualQuantity === 0) return entryPrice; // Avoid division by zero
    
    // Calculate the price change that would result in the desired risk
    const priceChange = maxRiskAmount / actualQuantity;
    
    // Calculate stop loss price based on position type
    return isShort ? entryPrice + priceChange : entryPrice - priceChange;
  };

  const calculatePositionFromDollarRisk = (
    entryPrice: number,
    stopLoss: number,
    dollarRiskAmount: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean
  ) => {
    if (dollarRiskAmount <= 0) return 0; // Avoid invalid inputs
    
    // Calculate price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    if (priceChange === 0) return 0; // Avoid division by zero
    
    // Calculate the position size in coins
    const positionSizeCoins = dollarRiskAmount / priceChange;
    
    // Return either coins or dollar equivalent based on quantityType
    return quantityType === 'coins' 
      ? positionSizeCoins 
      : positionSizeCoins * entryPrice;
  };

  const getTradeStats = (): TradeStats => {
    const closedTrades = trades.filter(trade => !trade.isActive && trade.exitPrice);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0
      };
    }

    const winningTrades = closedTrades.filter(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      return (trade.exitPrice! - trade.entryPrice) * (isShort ? -1 : 1) > 0;
    });
    
    const losingTrades = closedTrades.filter(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      return (trade.exitPrice! - trade.entryPrice) * (isShort ? -1 : 1) <= 0;
    });

    const totalProfit = closedTrades.reduce((sum, trade) => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      const profit = (trade.exitPrice! - trade.entryPrice) * actualQuantity * 
                    (isShort ? -1 : 1);
      return sum + profit;
    }, 0);

    const winningProfits = winningTrades.map(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      return (trade.exitPrice! - trade.entryPrice) * actualQuantity * 
        (isShort ? -1 : 1);
    });
    
    const losingLosses = losingTrades.map(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      return (trade.exitPrice! - trade.entryPrice) * actualQuantity * 
        (isShort ? -1 : 1);
    });

    const totalWinnings = winningProfits.reduce((sum, profit) => sum + profit, 0);
    const totalLosses = Math.abs(losingLosses.reduce((sum, loss) => sum + loss, 0));

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalProfit,
      averageProfit: winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWinnings / totalLosses : totalWinnings > 0 ? Infinity : 0
    };
  };

  const getBitcoinComparison = (period: TimePeriod = 'all'): BitcoinComparison => {
    // Filter trades based on the selected time period
    const now = new Date();
    let startDate = new Date(0); // Default to earliest possible date
    
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === 'quarter') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
    }
    
    // Filter trades based on the selected period
    const filteredTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= startDate;
    });
    
    // Calculate trading profit for the filtered period
    const tradingProfit = filteredTrades
      .filter(trade => !trade.isActive && trade.exitPrice)
      .reduce((sum, trade) => {
        const isShort = trade.cryptocurrency.toLowerCase().includes('short');
        const actualQuantity = trade.quantityType === 'dollars' 
          ? trade.quantity / trade.entryPrice 
          : trade.quantity;
        
        const profit = (trade.exitPrice! - trade.entryPrice) * actualQuantity * 
                      (isShort ? -1 : 1);
        return sum + profit;
      }, 0);
    
    // Calculate total investment amount for the period
    const totalInvestment = filteredTrades.reduce((sum, trade) => {
      return sum + (trade.quantityType === 'dollars' 
        ? trade.quantity 
        : trade.quantity * trade.entryPrice);
    }, 0);
    
    // If no trades in the period, return zeros
    if (filteredTrades.length === 0) {
      return {
        tradingProfit: 0,
        holdingProfit: 0,
        difference: 0,
        percentageDifference: 0,
        period,
        yearStartBalance: period === 'year' ? yearStartBalance : undefined
      };
    }
    
    // Find the earliest trade date in the filtered period
    const earliestTrade = filteredTrades.reduce((earliest, trade) => 
      new Date(trade.entryDate) < new Date(earliest.entryDate) ? trade : earliest
    );
    
    // Calculate Bitcoin holding profit
    // In a real app, you would fetch the actual Bitcoin price at the earliest date
    // and the current price to calculate the actual holding profit
    
    let holdingProfit = 0;
    
    if (period === 'year') {
      // For yearly comparison, use the year start balance
      // Assuming Bitcoin has appreciated by 10% per month since the start of the year
      const currentMonth = now.getMonth() + 1; // +1 because getMonth() is 0-indexed
      const bitcoinGrowthRate = Math.pow(1.10, currentMonth); // 10% monthly growth
      holdingProfit = yearStartBalance * bitcoinGrowthRate - yearStartBalance;
    } else {
      // For other periods, use the standard calculation
      const earliestDate = new Date(earliestTrade.entryDate);
      const monthsPassed = Math.max(1, 
        (now.getFullYear() - earliestDate.getFullYear()) * 12 + 
        now.getMonth() - earliestDate.getMonth()
      );
      
      // Simplified Bitcoin holding profit calculation
      // Assuming the same amount was invested in Bitcoin at the earliest trade date
      const bitcoinGrowthRate = Math.pow(1.10, monthsPassed); // 10% monthly growth
      holdingProfit = totalInvestment * bitcoinGrowthRate - totalInvestment;
    }
    
    const difference = tradingProfit - holdingProfit;
    const percentageDifference = holdingProfit !== 0 ? (difference / holdingProfit) * 100 : 0;
    
    return {
      tradingProfit,
      holdingProfit,
      difference,
      percentageDifference,
      period,
      yearStartBalance: period === 'year' ? yearStartBalance : undefined
    };
  };

  return (
    <TradeContext.Provider
      value={{
        trades,
        addTrade,
        updateTrade,
        closeTrade,
        updateStopLoss,
        deleteTrade,
        importTrades,
        calculateRisk,
        getTradeStats,
        getBitcoinComparison,
        portfolioValue,
        setPortfolioValue,
        yearStartBalance,
        setYearStartBalance,
        calculatePositionFromRisk,
        calculateStopLossFromRisk,
        calculatePositionFromDollarRisk
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}; 