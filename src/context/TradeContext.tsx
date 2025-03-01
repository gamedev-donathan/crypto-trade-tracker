import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Trade, TradeStats, BitcoinComparison, TimePeriod, PortfolioPerformance, PortfolioSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Create a separate context for portfolio value to ensure it's globally accessible
interface PortfolioContextType {
  portfolioValue: number;
  setPortfolioValue: (value: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// Custom hook to access portfolio value from any component
export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'isActive'>) => void;
  updateTrade: (id: string, updatedTrade: Partial<Trade>) => void;
  closeTrade: (id: string, exitPrice: number, exitDate?: string) => void;
  closePartialTrade: (id: string, exitPrice: number, exitQuantity: number, notes?: string) => void;
  setTrailingStop: (id: string, trailingAmount: number, trailingType: 'percentage' | 'fixed') => void;
  updateTrailingStops: () => void;
  updateStopLoss: (id: string, newStopLoss: number) => void;
  deleteTrade: (id: string) => void;
  importTrades: (importedTrades: Trade[]) => void;
  calculateRisk: (entryPrice: number, stopLoss: number, quantity: number, quantityType: 'coins' | 'dollars', portfolioValue: number, isShort?: boolean) => number;
  getTradeStats: (period?: TimePeriod) => TradeStats;
  getBitcoinComparison: (period?: TimePeriod) => BitcoinComparison;
  yearStartBalance: number;
  setYearStartBalance: React.Dispatch<React.SetStateAction<number>>;
  monthStartBalance: number;
  setMonthStartBalance: React.Dispatch<React.SetStateAction<number>>;
  quarterStartBalance: number;
  setQuarterStartBalance: React.Dispatch<React.SetStateAction<number>>;
  allTimeStartBalance: number;
  setAllTimeStartBalance: React.Dispatch<React.SetStateAction<number>>;
  calculatePositionFromRisk: (entryPrice: number, stopLoss: number, riskPercentage: number, portfolioValue: number, quantityType: 'coins' | 'dollars', isShort?: boolean) => number;
  calculateStopLossFromRisk: (entryPrice: number, quantity: number, riskPercentage: number, portfolioValue: number, quantityType: 'coins' | 'dollars', isShort?: boolean) => number;
  calculatePositionFromDollarRisk: (entryPrice: number, stopLoss: number, dollarRisk: number, quantityType: 'coins' | 'dollars', isShort?: boolean) => number;
  portfolioSettings: PortfolioSettings;
  setPortfolioSettings: (settings: PortfolioSettings) => void;
  getPortfolioPerformance: (timeRange: TimePeriod) => PortfolioPerformance[];
  calculateCurrentPortfolioValue: () => number;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within a TradeProvider');
  }
  
  // Get portfolio value from PortfolioContext
  const { portfolioValue, setPortfolioValue } = usePortfolio();
  
  // Return combined context with portfolio value
  return {
    ...context,
    portfolioValue,
    setPortfolioValue
  };
};

interface TradeProviderProps {
  children: ReactNode;
}

// Combined provider that provides both contexts
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

  const [monthStartBalance, setMonthStartBalance] = useState<number>(() => {
    const savedValue = localStorage.getItem('monthStartBalance');
    return savedValue ? parseFloat(savedValue) : portfolioValue;
  });

  const [quarterStartBalance, setQuarterStartBalance] = useState<number>(() => {
    const savedValue = localStorage.getItem('quarterStartBalance');
    return savedValue ? parseFloat(savedValue) : portfolioValue;
  });

  const [allTimeStartBalance, setAllTimeStartBalance] = useState<number>(() => {
    const savedValue = localStorage.getItem('allTimeStartBalance');
    return savedValue ? parseFloat(savedValue) : portfolioValue;
  });

  const [portfolioSettings, setPortfolioSettings] = useState<PortfolioSettings>(() => {
    const savedSettings = localStorage.getItem('portfolioSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    // Default to 1 year ago
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 1);
    return {
      startDate: defaultDate.toISOString().split('T')[0],
      initialBalance: portfolioValue
    };
  });

  // Calculate current portfolio value based on trades
  const calculateCurrentPortfolioValue = useCallback(() => {
    // Start with the initial balance from portfolio settings
    let currentValue = portfolioSettings.initialBalance;
    
    // Process all closed trades
    const closedTrades = trades.filter(trade => !trade.isActive && trade.exitPrice);
    closedTrades.forEach(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      
      // Calculate actual quantity in coins if input is in dollars
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      // Calculate profit/loss
      const profitLoss = (trade.exitPrice! - trade.entryPrice) * actualQuantity * (isShort ? -1 : 1);
      
      // Add profit/loss to current value
      currentValue += profitLoss;
    });
    
    // Process partial exits
    trades.forEach(trade => {
      if (trade.partialExits && trade.partialExits.length > 0) {
        const isShort = trade.cryptocurrency.toLowerCase().includes('short');
        
        trade.partialExits.forEach(exit => {
          // Calculate actual quantity for this exit
          const actualExitQuantity = trade.quantityType === 'dollars'
            ? exit.exitQuantity / trade.entryPrice
            : exit.exitQuantity;
          
          // Calculate profit/loss for this partial exit
          const profitLoss = (exit.exitPrice - trade.entryPrice) * actualExitQuantity * (isShort ? -1 : 1);
          
          // Add profit/loss to current value
          currentValue += profitLoss;
        });
      }
    });
    
    return currentValue;
  }, [trades, portfolioSettings.initialBalance]);

  // Update portfolio value whenever trades change
  useEffect(() => {
    const newPortfolioValue = calculateCurrentPortfolioValue();
    setPortfolioValue(newPortfolioValue);
  }, [trades, calculateCurrentPortfolioValue]);

  useEffect(() => {
    localStorage.setItem('trades', JSON.stringify(trades));
  }, [trades]);

  useEffect(() => {
    localStorage.setItem('portfolioValue', portfolioValue.toString());
  }, [portfolioValue]);

  useEffect(() => {
    localStorage.setItem('yearStartBalance', yearStartBalance.toString());
  }, [yearStartBalance]);

  useEffect(() => {
    localStorage.setItem('monthStartBalance', monthStartBalance.toString());
  }, [monthStartBalance]);

  useEffect(() => {
    localStorage.setItem('quarterStartBalance', quarterStartBalance.toString());
  }, [quarterStartBalance]);

  useEffect(() => {
    localStorage.setItem('allTimeStartBalance', allTimeStartBalance.toString());
  }, [allTimeStartBalance]);

  useEffect(() => {
    localStorage.setItem('portfolioSettings', JSON.stringify(portfolioSettings));
  }, [portfolioSettings]);

  const addTrade = (trade: Omit<Trade, 'id' | 'isActive'>) => {
    const newTrade: Trade = {
      ...trade,
      id: uuidv4(),
      isActive: true,
    };
    setTrades([...trades, newTrade]);
  };

  const updateTrade = (id: string, updatedTrade: Partial<Trade>) => {
    setTrades(trades.map(trade => 
      trade.id === id ? { ...trade, ...updatedTrade } : trade
    ));
  };

  const closeTrade = (id: string, exitPrice: number, exitDate?: string) => {
    setTrades(trades.map(trade => 
      trade.id === id 
        ? { 
            ...trade, 
            isActive: false, 
            exitPrice, 
            exitDate: exitDate ? new Date(`${exitDate}T00:00:00`).toISOString() : new Date().toISOString() 
          } 
        : trade
    ));
  };

  // New function for partial trade closure
  const closePartialTrade = (id: string, exitPrice: number, exitQuantity: number, notes?: string) => {
    setTrades(trades.map(trade => {
      if (trade.id !== id) return trade;
      
      // Calculate remaining quantity after partial exit
      const originalQuantity = trade.originalQuantity || trade.quantity;
      const currentRemaining = trade.remainingQuantity || trade.quantity;
      
      // Ensure we're not trying to close more than what's available
      const validExitQuantity = Math.min(exitQuantity, currentRemaining);
      const newRemainingQuantity = currentRemaining - validExitQuantity;
      
      // Create a new partial exit record
      const partialExit = {
        id: uuidv4(),
        exitDate: new Date().toISOString(),
        exitPrice,
        exitQuantity: validExitQuantity,
        notes
      };
      
      // If closing the entire remaining position, mark as inactive
      if (newRemainingQuantity <= 0) {
        return {
          ...trade,
          isActive: false,
          exitPrice,
          exitDate: new Date().toISOString(),
          remainingQuantity: 0,
          originalQuantity,
          partialExits: [...(trade.partialExits || []), partialExit]
        };
      }
      
      // Otherwise, update the remaining quantity and add to partial exits
      return {
        ...trade,
        remainingQuantity: newRemainingQuantity,
        originalQuantity,
        partialExits: [...(trade.partialExits || []), partialExit]
      };
    }));
  };
  
  // Set up a trailing stop for a trade
  const setTrailingStop = (id: string, trailingAmount: number, trailingType: 'percentage' | 'fixed') => {
    setTrades(trades.map(trade => {
      if (trade.id !== id) return trade;
      
      // For a new trailing stop, set the highest price to the current entry price
      // In a real app, you would use the current market price instead
      const highestPrice = trade.highestPrice || trade.entryPrice;
      
      // Calculate the new stop loss based on trailing amount
      let newStopLoss = trade.stopLoss;
      if (trailingType === 'percentage') {
        // For percentage trailing stops, calculate based on percentage of highest price
        const isShort = trade.cryptocurrency.toLowerCase().includes('short');
        if (isShort) {
          // For short positions, stop loss is above entry
          newStopLoss = highestPrice * (1 + trailingAmount / 100);
        } else {
          // For long positions, stop loss is below entry
          newStopLoss = highestPrice * (1 - trailingAmount / 100);
        }
      } else {
        // For fixed trailing stops, simply add/subtract the fixed amount
        const isShort = trade.cryptocurrency.toLowerCase().includes('short');
        if (isShort) {
          // For short positions, stop loss is above entry
          newStopLoss = highestPrice + trailingAmount;
        } else {
          // For long positions, stop loss is below entry
          newStopLoss = highestPrice - trailingAmount;
        }
      }
      
      return {
        ...trade,
        isTrailingStop: true,
        trailingAmount,
        trailingType,
        highestPrice,
        stopLoss: newStopLoss
      };
    }));
  };
  
  // Update all trailing stops based on current market prices
  const updateTrailingStops = () => {
    // Since we don't have current prices passed in, we'll need to fetch them
    // For now, we'll just skip this functionality until we implement price fetching
    console.log('Trailing stop updates require current price data');
    
    // In a real implementation, we would:
    // 1. Fetch current prices for all cryptocurrencies in active trades
    // 2. Update the trailing stops based on those prices
    
    // This is a placeholder for future implementation
    /*
    setTrades(trades.map(trade => {
      // Skip trades that don't have trailing stops or are not active
      if (!trade.isTrailingStop || !trade.isActive) return trade;
      
      // Get current price for this cryptocurrency
      const currentPrice = currentPrices[trade.coinId];
      if (!currentPrice) return trade; // Skip if no price available
      
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      
      // For long positions, we only care about price increases
      // For short positions, we only care about price decreases
      if ((isShort && currentPrice >= trade.entryPrice) || 
          (!isShort && currentPrice <= trade.entryPrice)) {
        return trade;
      }
      
      // Update highest/lowest price if needed
      let updatedTrade = { ...trade };
      
      if (isShort) {
        // For shorts, we track the lowest price
        if (!trade.lowestPrice || currentPrice < trade.lowestPrice) {
          updatedTrade.lowestPrice = currentPrice;
        }
      } else {
        // For longs, we track the highest price
        if (!trade.highestPrice || currentPrice > trade.highestPrice) {
          updatedTrade.highestPrice = currentPrice;
        }
      }
      
      // Calculate new stop loss based on trailing amount
      const referencePrice = isShort ? updatedTrade.lowestPrice : updatedTrade.highestPrice;
      
      if (referencePrice) {
        let newStopLoss;
        
        if (trade.trailingType === 'percentage') {
          // Calculate percentage-based trailing stop
          const trailingDistance = referencePrice * (trade.trailingAmount / 100);
          newStopLoss = isShort 
            ? referencePrice * (1 + trade.trailingAmount / 100) // For shorts, stop is above the lowest price
            : referencePrice * (1 - trade.trailingAmount / 100); // For longs, stop is below the highest price
        } else {
          // Calculate fixed-amount trailing stop
          newStopLoss = isShort
            ? referencePrice + trade.trailingAmount // For shorts, stop is above the lowest price
            : referencePrice - trade.trailingAmount; // For longs, stop is below the highest price
        }
        
        // Only update stop loss if the new one is better than the current one
        // For longs: better means higher stop loss
        // For shorts: better means lower stop loss
        if ((isShort && newStopLoss < trade.stopLoss) || 
            (!isShort && newStopLoss > trade.stopLoss)) {
          updatedTrade.stopLoss = newStopLoss;
        }
      }
      
      return updatedTrade;
    }));
    */
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

  const calculateRisk = (entryPrice: number, stopLoss: number, quantity: number, quantityType: 'coins' | 'dollars', portfolioValue: number, isShort?: boolean) => {
    if (portfolioValue <= 0 || entryPrice <= 0) return 0; // Avoid division by zero
    
    // For dollar-based positions, we need to calculate how many coins that represents
    const actualQuantity = quantityType === 'dollars' ? quantity / entryPrice : quantity;
    
    // Calculate the price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    // Calculate the dollar risk
    const dollarRisk = priceChange * actualQuantity;
    
    // Calculate the risk as a percentage of portfolio
    return (dollarRisk / portfolioValue) * 100;
  };

  const calculatePositionFromRisk = (
    entryPrice: number, 
    stopLoss: number, 
    riskPercentage: number, 
    portfolioValue: number, 
    quantityType: 'coins' | 'dollars',
    isShort?: boolean
  ) => {
    if (portfolioValue <= 0 || entryPrice <= 0 || entryPrice === stopLoss) return 0; // Avoid division by zero
    
    // Calculate the price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    // Calculate the dollar risk amount
    const dollarRiskAmount = (riskPercentage / 100) * portfolioValue;
    
    // Calculate the position size in coins
    const positionSizeCoins = dollarRiskAmount / priceChange;
    
    // Return either the coin amount or the dollar equivalent
    return quantityType === 'dollars' ? positionSizeCoins * entryPrice : positionSizeCoins;
  };

  const calculateStopLossFromRisk = (
    entryPrice: number,
    quantity: number,
    riskPercentage: number,
    portfolioValue: number,
    quantityType: 'coins' | 'dollars',
    isShort?: boolean
  ) => {
    if (portfolioValue <= 0 || entryPrice <= 0) return 0; // Avoid division by zero
    
    // Calculate the dollar risk amount
    const dollarRiskAmount = (riskPercentage / 100) * portfolioValue;
    
    // Calculate the actual quantity in coins
    const actualQuantity = quantityType === 'dollars' ? quantity / entryPrice : quantity;
    
    if (actualQuantity <= 0) return 0; // Avoid division by zero
    
    // Calculate the price change needed to reach the desired risk
    const priceChange = dollarRiskAmount / actualQuantity;
    
    // Calculate the stop loss price with full precision
    return isShort ? entryPrice + priceChange : entryPrice - priceChange;
  };

  const calculatePositionFromDollarRisk = (
    entryPrice: number,
    stopLoss: number,
    dollarRiskAmount: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean = false
  ) => {
    if (entryPrice <= 0 || entryPrice === stopLoss) return 0; // Avoid division by zero
    
    // Calculate the price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    // Calculate the position size in coins
    const positionSizeCoins = dollarRiskAmount / priceChange;
    
    // Return either the coin amount or the dollar equivalent
    return quantityType === 'dollars' ? positionSizeCoins * entryPrice : positionSizeCoins;
  };

  // Filter trades based on time period
  const filterTradesByPeriod = (trades: Trade[], period: TimePeriod): Trade[] => {
    if (period === 'all') return trades;
    
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return trades;
    }
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate);
      return tradeDate >= startDate;
    });
  };

  const getTradeStats = (period?: TimePeriod): TradeStats => {
    // Filter trades based on the selected time period
    const actualPeriod: TimePeriod = period || 'all';
    const filteredTrades = filterTradesByPeriod(trades, actualPeriod);
    const closedTrades = filteredTrades.filter(trade => !trade.isActive && trade.exitPrice);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        averageProfit: 0,
        averageLoss: 0,
        profitFactor: 0,
        bestTrade: null,
        worstTrade: null,
        averageR: 0
      };
    }

    // Calculate profit/loss for each trade
    const tradesWithProfits = closedTrades.map(trade => {
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      const profit = (trade.exitPrice! - trade.entryPrice) * actualQuantity * 
                    (isShort ? -1 : 1);
      
      // Calculate R-multiple if stopLoss is available
      let rMultiple = 0;
      if (trade.stopLoss) {
        const risk = Math.abs(trade.entryPrice - trade.stopLoss);
        if (risk > 0) {
          const reward = Math.abs(trade.exitPrice! - trade.entryPrice);
          rMultiple = (reward / risk) * (profit > 0 ? 1 : -1);
        }
      }
      
      return { ...trade, profit, rMultiple };
    });

    const winningTrades = tradesWithProfits.filter(trade => trade.profit > 0);
    const losingTrades = tradesWithProfits.filter(trade => trade.profit <= 0);

    // Find best and worst trades
    const bestTrade = tradesWithProfits.length > 0 
      ? tradesWithProfits.reduce((best, current) => 
          current.profit > best.profit ? current : best, tradesWithProfits[0])
      : null;
      
    const worstTrade = tradesWithProfits.length > 0 
      ? tradesWithProfits.reduce((worst, current) => 
          current.profit < worst.profit ? current : worst, tradesWithProfits[0])
      : null;

    const totalProfit = tradesWithProfits.reduce((sum, trade) => sum + trade.profit, 0);

    const winningProfits = winningTrades.map(trade => trade.profit);
    const losingLosses = losingTrades.map(trade => trade.profit);

    const totalWinnings = winningProfits.reduce((sum, profit) => sum + profit, 0);
    const totalLosses = Math.abs(losingLosses.reduce((sum, loss) => sum + loss, 0));
    
    // Calculate average R-multiple
    const validRTrades = tradesWithProfits.filter(trade => trade.rMultiple !== 0);
    const averageR = validRTrades.length > 0
      ? validRTrades.reduce((sum, trade) => sum + trade.rMultiple, 0) / validRTrades.length
      : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedTrades.length) * 100,
      totalProfit,
      averageProfit: winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      profitFactor: totalLosses > 0 ? totalWinnings / totalLosses : totalWinnings > 0 ? Infinity : 0,
      bestTrade,
      worstTrade,
      averageR
    };
  };

  const getBitcoinComparison = (period?: TimePeriod): BitcoinComparison => {
    // Filter trades based on the selected time period
    const actualPeriod: TimePeriod = period || 'all';
    const filteredTrades = filterTradesByPeriod(trades, actualPeriod);
    
    // Calculate trading profit for the filtered trades
    const tradingProfit = filteredTrades.reduce((sum, trade) => {
      if (trade.isActive) return sum; // Skip active trades
      
      const isShort = trade.cryptocurrency.toLowerCase().includes('short');
      const actualQuantity = trade.quantityType === 'dollars' 
        ? trade.quantity / trade.entryPrice 
        : trade.quantity;
      
      if (!trade.exitPrice) return sum; // Skip trades without exit price
      
      const profit = (trade.exitPrice - trade.entryPrice) * actualQuantity * 
                    (isShort ? -1 : 1);
      return sum + profit;
    }, 0);
    
    // Get portfolio performance data for the selected period
    const performanceData = getPortfolioPerformance(actualPeriod);
    
    // Variables to track if we're using the exact start of the period
    let isFullPeriod = true;
    let actualStartDate = '';
    let startBalance = allTimeStartBalance;
    let periodStartDate: Date | null = null;
    
    // Determine the appropriate start date and balance based on the selected period
    const now = new Date();
    
    switch (actualPeriod) {
      case 'month':
        // Start of current month
        periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        // Start of current quarter
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        periodStartDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'year':
        // Start of current year
        periodStartDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        // Use portfolio start date from settings
        periodStartDate = new Date(portfolioSettings.startDate);
        break;
    }
    
    if (periodStartDate) {
      // Format date to YYYY-MM-DD for comparison
      const formattedPeriodStartDate = periodStartDate.toISOString().split('T')[0];
      
      // Find the closest portfolio value to the period start date
      if (performanceData.length > 0) {
        // Sort by date (should already be sorted, but just to be safe)
        const sortedPerformance = [...performanceData].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Try to find exact match for period start date
        const exactMatch = sortedPerformance.find(p => p.date === formattedPeriodStartDate);
        
        if (exactMatch) {
          // We have data for the exact start date
          startBalance = exactMatch.portfolioValue;
          actualStartDate = exactMatch.date;
        } else {
          // Find the closest date after the period start
          const closestAfter = sortedPerformance.find(p => p.date >= formattedPeriodStartDate);
          
          if (closestAfter) {
            startBalance = closestAfter.portfolioValue;
            actualStartDate = closestAfter.date;
            
            // Check if this date is different from the period start date
            isFullPeriod = closestAfter.date === formattedPeriodStartDate;
          } else if (sortedPerformance.length > 0) {
            // If no data after period start, use the earliest data point
            const earliest = sortedPerformance[0];
            startBalance = earliest.portfolioValue;
            actualStartDate = earliest.date;
            isFullPeriod = false;
          }
        }
      }
    }
    
    // Calculate months passed for Bitcoin growth
    let monthsPassed = 0;
    
    if (actualStartDate) {
      const startDate = new Date(actualStartDate);
      monthsPassed = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                    (now.getMonth() - startDate.getMonth());
      
      // Add partial month based on days
      const daysPassed = now.getDate() - startDate.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      monthsPassed += daysPassed / daysInMonth;
    } else {
      // Fallback to default calculation
      switch (actualPeriod) {
        case 'month':
          monthsPassed = 1;
          break;
        case 'quarter':
          monthsPassed = 3;
          break;
        case 'year':
          monthsPassed = 12;
          break;
        case 'all':
          // Calculate months since the first trade or portfolio start date
          const firstTradeDate = trades.length > 0 
            ? new Date(Math.min(...trades.map(t => new Date(t.entryDate).getTime())))
            : new Date(portfolioSettings.startDate);
          
          monthsPassed = (now.getFullYear() - firstTradeDate.getFullYear()) * 12 + 
                        (now.getMonth() - firstTradeDate.getMonth());
          break;
      }
    }
    
    monthsPassed = Math.max(0.1, monthsPassed); // At least 0.1 month to avoid division by zero
    
    // Calculate Bitcoin growth rate (10% monthly)
    const bitcoinGrowthRate = Math.pow(1.1, monthsPassed) - 1;
    const holdingProfit = startBalance * bitcoinGrowthRate;
    
    // Check if there are any trades in the period
    if (filteredTrades.filter(t => !t.isActive && t.exitPrice).length === 0) {
      return {
        tradingProfit: 0,
        holdingProfit,
        difference: -holdingProfit,
        percentageDifference: -100,
        period: actualPeriod,
        yearStartBalance,
        monthStartBalance,
        quarterStartBalance,
        allTimeStartBalance,
        startBalance,
        isFullPeriod,
        actualStartDate
      };
    }
    
    // Calculate the difference and percentage difference
    const difference = tradingProfit - holdingProfit;
    const percentageDifference = holdingProfit !== 0 
      ? (difference / Math.abs(holdingProfit)) * 100 
      : tradingProfit > 0 ? 100 : 0;
    
    return {
      tradingProfit,
      holdingProfit,
      difference,
      percentageDifference,
      period: actualPeriod,
      yearStartBalance,
      monthStartBalance,
      quarterStartBalance,
      allTimeStartBalance,
      startBalance,
      isFullPeriod,
      actualStartDate
    };
  };

  const getPortfolioPerformance = (timeRange: TimePeriod = 'all'): PortfolioPerformance[] => {
    if (trades.length === 0) {
      return [];
    }

    // Sort trades by date (oldest first)
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    // Get the earliest trade date or use portfolio start date if set
    const startDate = new Date(portfolioSettings.startDate);
    const initialBalance = portfolioSettings.initialBalance;
    
    // For time-based filtering
    let filterDate = new Date(0); // Default to earliest possible date
    const now = new Date();
    
    if (timeRange === 'month') {
      // Start from the beginning of the current month
      filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'quarter') {
      // Start from 3 months ago
      filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (timeRange === 'year') {
      // Start from January 1st of current year
      filterDate = new Date(now.getFullYear(), 0, 1);
    }
    
    // Create a map of dates to track daily performance
    const performanceMap = new Map<string, PortfolioPerformance>();
    
    // Initialize with start date
    const formattedStartDate = startDate.toISOString().split('T')[0];
    performanceMap.set(formattedStartDate, {
      date: formattedStartDate,
      portfolioValue: initialBalance,
      cumulativeProfit: 0,
      tradeCount: 0
    });
    
    // Track running totals
    let cumulativeProfit = 0;
    let tradeCount = 0;
    let currentPortfolioValue = initialBalance;
    
    // Process each trade
    sortedTrades.forEach(trade => {
      // Skip trades before the start date or filter date
      const tradeDate = new Date(trade.entryDate);
      if (tradeDate < startDate || tradeDate < filterDate) {
        return;
      }
      
      // Handle entry date
      const entryDate = tradeDate.toISOString().split('T')[0];
      tradeCount++;
      
      // Handle exit date and profit calculation if trade is closed
      if (!trade.isActive && trade.exitPrice && trade.exitDate) {
        const exitDate = new Date(trade.exitDate).toISOString().split('T')[0];
        
        // Calculate profit/loss
        const isShort = trade.cryptocurrency.toLowerCase().includes('short');
        const actualQuantity = trade.quantityType === 'dollars' 
          ? trade.quantity / trade.entryPrice 
          : trade.quantity;
        
        const profit = (trade.exitPrice - trade.entryPrice) * actualQuantity * (isShort ? -1 : 1);
        cumulativeProfit += profit;
        currentPortfolioValue += profit;
        
        // Update or create the exit date entry
        const existingExitData = performanceMap.get(exitDate);
        if (existingExitData) {
          performanceMap.set(exitDate, {
            ...existingExitData,
            portfolioValue: currentPortfolioValue,
            cumulativeProfit,
            tradeCount
          });
        } else {
          performanceMap.set(exitDate, {
            date: exitDate,
            portfolioValue: currentPortfolioValue,
            cumulativeProfit,
            tradeCount
          });
        }
      }
      
      // Always update the entry date with the latest data
      const existingEntryData = performanceMap.get(entryDate);
      if (existingEntryData) {
        performanceMap.set(entryDate, {
          ...existingEntryData,
          tradeCount
        });
      } else {
        performanceMap.set(entryDate, {
          date: entryDate,
          portfolioValue: currentPortfolioValue,
          cumulativeProfit,
          tradeCount
        });
      }
    });
    
    // Fill in gaps between dates to create a continuous timeline
    const allDates = Array.from(performanceMap.keys()).sort();
    if (allDates.length > 1) {
      for (let i = 0; i < allDates.length - 1; i++) {
        const currentDate = new Date(allDates[i]);
        const nextDate = new Date(allDates[i + 1]);
        
        // Fill in missing dates
        currentDate.setDate(currentDate.getDate() + 1);
        while (currentDate < nextDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const previousData = performanceMap.get(allDates[i])!;
          
          performanceMap.set(dateStr, {
            date: dateStr,
            portfolioValue: previousData.portfolioValue,
            cumulativeProfit: previousData.cumulativeProfit,
            tradeCount: previousData.tradeCount
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    // Add today's date if not already included
    const today = new Date().toISOString().split('T')[0];
    if (!performanceMap.has(today)) {
      const lastDate = allDates[allDates.length - 1];
      const lastData = performanceMap.get(lastDate)!;
      
      performanceMap.set(today, {
        date: today,
        portfolioValue: currentPortfolioValue,
        cumulativeProfit,
        tradeCount
      });
    }
    
    // Convert map to array and sort by date
    return Array.from(performanceMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Update the setPortfolioSettings function to also update the initial balance
  const updatePortfolioSettings = (settings: PortfolioSettings) => {
    setPortfolioSettings(settings);
    
    // If the initial balance has changed, update the reference balances if they match the old initial balance
    if (settings.initialBalance !== portfolioSettings.initialBalance) {
      // Only update reference balances if they haven't been manually changed
      if (yearStartBalance === portfolioSettings.initialBalance) {
        setYearStartBalance(settings.initialBalance);
      }
      if (monthStartBalance === portfolioSettings.initialBalance) {
        setMonthStartBalance(settings.initialBalance);
      }
      if (quarterStartBalance === portfolioSettings.initialBalance) {
        setQuarterStartBalance(settings.initialBalance);
      }
      if (allTimeStartBalance === portfolioSettings.initialBalance) {
        setAllTimeStartBalance(settings.initialBalance);
      }
    }
  };

  return (
    <PortfolioContext.Provider value={{ portfolioValue, setPortfolioValue }}>
      <TradeContext.Provider
        value={{
          trades,
          addTrade,
          updateTrade,
          closeTrade,
          closePartialTrade,
          setTrailingStop,
          updateTrailingStops,
          updateStopLoss,
          deleteTrade,
          importTrades,
          calculateRisk,
          getTradeStats,
          getBitcoinComparison,
          yearStartBalance,
          setYearStartBalance,
          monthStartBalance,
          setMonthStartBalance,
          quarterStartBalance,
          setQuarterStartBalance,
          allTimeStartBalance,
          setAllTimeStartBalance,
          calculatePositionFromRisk,
          calculateStopLossFromRisk,
          calculatePositionFromDollarRisk,
          portfolioSettings,
          setPortfolioSettings: updatePortfolioSettings,
          getPortfolioPerformance,
          calculateCurrentPortfolioValue
        }}
      >
        {children}
      </TradeContext.Provider>
    </PortfolioContext.Provider>
  );
}; 