import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  updateTrade: (trade: Trade) => void;
  closeTrade: (id: string, exitPrice: number) => void;
  updateStopLoss: (id: string, newStopLoss: number) => void;
  deleteTrade: (id: string) => void;
  importTrades: (trades: Trade[]) => void;
  calculateRisk: (entryPrice: number, stopLoss: number, quantity: number, quantityType: 'coins' | 'dollars', portfolioValue: number, isShort: boolean) => number;
  getTradeStats: () => TradeStats;
  getBitcoinComparison: (period?: TimePeriod) => BitcoinComparison;
  yearStartBalance: number;
  setYearStartBalance: (value: number) => void;
  monthStartBalance: number;
  setMonthStartBalance: (value: number) => void;
  quarterStartBalance: number;
  setQuarterStartBalance: (value: number) => void;
  allTimeStartBalance: number;
  setAllTimeStartBalance: (value: number) => void;
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
  portfolioSettings: PortfolioSettings;
  setPortfolioSettings: (settings: PortfolioSettings) => void;
  getPortfolioPerformance: () => PortfolioPerformance[];
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
    desiredRiskPercent: number, 
    portfolioValue: number, 
    quantityType: 'coins' | 'dollars',
    isShort: boolean = false
  ) => {
    if (portfolioValue <= 0 || entryPrice <= 0 || entryPrice === stopLoss) return 0; // Avoid division by zero
    
    // Calculate the price change (always positive)
    const priceChange = Math.abs(entryPrice - stopLoss);
    
    // Calculate the dollar risk amount
    const dollarRiskAmount = (desiredRiskPercent / 100) * portfolioValue;
    
    // Calculate the position size in coins
    const positionSizeCoins = dollarRiskAmount / priceChange;
    
    // Return either the coin amount or the dollar equivalent
    return quantityType === 'dollars' ? positionSizeCoins * entryPrice : positionSizeCoins;
  };

  const calculateStopLossFromRisk = (
    entryPrice: number,
    quantity: number,
    desiredRiskPercent: number,
    portfolioValue: number,
    quantityType: 'coins' | 'dollars',
    isShort: boolean = false
  ) => {
    if (portfolioValue <= 0 || entryPrice <= 0) return 0; // Avoid division by zero
    
    // Calculate the dollar risk amount
    const dollarRiskAmount = (desiredRiskPercent / 100) * portfolioValue;
    
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
    let periodMonths = 0;
    
    if (period === 'month') {
      // Start from the beginning of the current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodMonths = (now.getDate() / 30); // Approximate fraction of month passed
    } else if (period === 'quarter') {
      // Start from 3 months ago
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      periodMonths = 3;
    } else if (period === 'year') {
      // Start from January 1st of current year
      startDate = new Date(now.getFullYear(), 0, 1);
      periodMonths = now.getMonth() + 1; // Current month (0-indexed) + 1
    } else {
      // For 'all', use the date of the first trade or a default date
      const firstTrade = trades.length > 0 
        ? trades.reduce((earliest, trade) => 
            new Date(trade.entryDate) < new Date(earliest.entryDate) ? trade : earliest
          )
        : null;
      
      if (firstTrade) {
        const firstTradeDate = new Date(firstTrade.entryDate);
        startDate = new Date(firstTradeDate.getFullYear(), firstTradeDate.getMonth(), 1);
        periodMonths = (now.getFullYear() - firstTradeDate.getFullYear()) * 12 + 
                      now.getMonth() - firstTradeDate.getMonth();
      } else {
        // If no trades, use 1 year ago as default
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        periodMonths = 12;
      }
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
    
    // Get the appropriate start balance based on the period
    let startBalance = portfolioValue;
    if (period === 'year') {
      startBalance = yearStartBalance;
    } else if (period === 'month') {
      startBalance = monthStartBalance;
    } else if (period === 'quarter') {
      startBalance = quarterStartBalance;
    } else if (period === 'all') {
      startBalance = allTimeStartBalance;
    }
    
    // Calculate Bitcoin holding profit
    // In a real app, you would fetch the actual Bitcoin price at the start date
    // and the current price to calculate the actual holding profit
    
    // Simplified Bitcoin holding profit calculation
    // Assuming Bitcoin has appreciated by 10% per month since the start of the period
    const bitcoinGrowthRate = Math.pow(1.10, periodMonths); // 10% monthly growth
    const holdingProfit = startBalance * bitcoinGrowthRate - startBalance;
    
    // If no trades in the period, only return the holding comparison
    if (filteredTrades.length === 0) {
      return {
        tradingProfit: 0,
        holdingProfit,
        difference: -holdingProfit,
        percentageDifference: holdingProfit !== 0 ? (-holdingProfit / holdingProfit) * 100 : 0,
        period,
        yearStartBalance: period === 'year' ? yearStartBalance : undefined,
        monthStartBalance: period === 'month' ? monthStartBalance : undefined,
        quarterStartBalance: period === 'quarter' ? quarterStartBalance : undefined,
        allTimeStartBalance: period === 'all' ? allTimeStartBalance : undefined
      };
    }
    
    const difference = tradingProfit - holdingProfit;
    const percentageDifference = holdingProfit !== 0 ? (difference / holdingProfit) * 100 : 0;
    
    return {
      tradingProfit,
      holdingProfit,
      difference,
      percentageDifference,
      period,
      yearStartBalance: period === 'year' ? yearStartBalance : undefined,
      monthStartBalance: period === 'month' ? monthStartBalance : undefined,
      quarterStartBalance: period === 'quarter' ? quarterStartBalance : undefined,
      allTimeStartBalance: period === 'all' ? allTimeStartBalance : undefined
    };
  };

  const getPortfolioPerformance = (): PortfolioPerformance[] => {
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
      // Skip trades before the start date
      if (new Date(trade.entryDate) < startDate) {
        return;
      }
      
      // Handle entry date
      const entryDate = new Date(trade.entryDate).toISOString().split('T')[0];
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

  return (
    <PortfolioContext.Provider value={{ portfolioValue, setPortfolioValue }}>
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
          setPortfolioSettings,
          getPortfolioPerformance
        }}
      >
        {children}
      </TradeContext.Provider>
    </PortfolioContext.Provider>
  );
}; 