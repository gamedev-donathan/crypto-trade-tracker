import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useTrades, usePortfolio } from '../context/TradeContext';
import { TimePeriod, PortfolioPerformance } from '../types';
import PortfolioChart from './PortfolioChart';

ChartJS.register(
  ArcElement, 
  ChartTooltip, 
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
);

const Dashboard: React.FC = () => {
  const { 
    trades, 
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
    getPortfolioPerformance,
    portfolioSettings
  } = useTrades();
  
  // Use the global portfolio value from the usePortfolio hook
  const { portfolioValue } = usePortfolio();
  
  const theme = useTheme();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [portfolioPerformance, setPortfolioPerformance] = useState<PortfolioPerformance[]>([]);
  
  // Fetch portfolio performance data
  useEffect(() => {
    const performanceData = getPortfolioPerformance();
    setPortfolioPerformance(performanceData);
  }, [getPortfolioPerformance, trades]);
  
  // Set default values for start balances based on portfolio performance
  useEffect(() => {
    if (portfolioPerformance.length > 0) {
      // Get the oldest portfolio value for all time
      const oldestData = portfolioPerformance[0];
      if (oldestData && allTimeStartBalance === portfolioValue) {
        setAllTimeStartBalance(oldestData.portfolioValue);
      }
      
      // Get the start of year portfolio value
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearStartData = portfolioPerformance.find(p => p.date.startsWith(yearStart));
      if (yearStartData && yearStartBalance === portfolioValue) {
        setYearStartBalance(yearStartData.portfolioValue);
      }
      
      // Get the start of quarter portfolio value
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const quarterStartDate = new Date(currentDate.getFullYear(), quarterStartMonth, 1);
      const quarterStart = quarterStartDate.toISOString().split('T')[0];
      const quarterStartData = portfolioPerformance.find(p => p.date >= quarterStart);
      if (quarterStartData && quarterStartBalance === portfolioValue) {
        setQuarterStartBalance(quarterStartData.portfolioValue);
      }
      
      // Get the start of month portfolio value
      const monthStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthStart = monthStartDate.toISOString().split('T')[0];
      const monthStartData = portfolioPerformance.find(p => p.date >= monthStart);
      if (monthStartData && monthStartBalance === portfolioValue) {
        setMonthStartBalance(monthStartData.portfolioValue);
      }
    }
  }, [
    portfolioPerformance, 
    setAllTimeStartBalance, 
    setYearStartBalance, 
    setQuarterStartBalance, 
    setMonthStartBalance,
    allTimeStartBalance,
    yearStartBalance,
    quarterStartBalance,
    monthStartBalance,
    portfolioValue
  ]);
  
  const stats = getTradeStats();
  const btcComparison = getBitcoinComparison(timePeriod);
  
  const handleTimePeriodChange = (
    event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null,
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };
  
  const handleYearStartBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setYearStartBalance(value);
    }
  };

  const handleMonthStartBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setMonthStartBalance(value);
    }
  };

  const handleQuarterStartBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setQuarterStartBalance(value);
    }
  };

  const handleAllTimeStartBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setAllTimeStartBalance(value);
    }
  };
  
  const winLossData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [stats.winningTrades, stats.losingTrades],
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.error.main,
        ],
        borderColor: [
          theme.palette.success.dark,
          theme.palette.error.dark,
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const profitComparisonData = {
    labels: ['Your Trading', 'Holding Bitcoin'],
    datasets: [
      {
        label: 'Profit Comparison',
        data: [btcComparison.tradingProfit, btcComparison.holdingProfit],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
        ],
        borderColor: [
          theme.palette.primary.dark,
          theme.palette.secondary.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'month':
        return 'Last Month';
      case 'quarter':
        return 'Last Quarter';
      case 'year':
        return 'Year to Date';
      default:
        return 'All Time';
    }
  };

  const getStartBalanceLabel = (period: TimePeriod): string => {
    switch (period) {
      case 'month':
        return 'Initial Bitcoin Investment (This Month)';
      case 'quarter':
        return 'Initial Bitcoin Investment (Last 3 Months)';
      case 'year':
        return 'Initial Bitcoin Investment (Jan 1st)';
      default:
        return 'Initial Bitcoin Investment (All Time)';
    }
  };

  const getCurrentStartBalance = (period: TimePeriod): number => {
    switch (period) {
      case 'month':
        return monthStartBalance;
      case 'quarter':
        return quarterStartBalance;
      case 'year':
        return yearStartBalance;
      default:
        return allTimeStartBalance;
    }
  };

  const handleStartBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      switch (timePeriod) {
        case 'month':
          setMonthStartBalance(value);
          break;
        case 'quarter':
          setQuarterStartBalance(value);
          break;
        case 'year':
          setYearStartBalance(value);
          break;
        default:
          setAllTimeStartBalance(value);
          break;
      }
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trading Dashboard
      </Typography>
      
      {/* Portfolio Performance Chart */}
      <PortfolioChart />
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Trades
              </Typography>
              <Typography variant="h5" component="div">
                {stats.totalTrades}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h5" component="div">
                {stats.winRate.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Profit
              </Typography>
              <Typography variant="h5" component="div" color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'}>
                ${stats.totalProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Profit Factor
              </Typography>
              <Typography variant="h5" component="div">
                {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Win/Loss Ratio
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {stats.totalTrades > 0 ? (
                <Pie data={winLossData} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    No trade data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Trading vs Holding Bitcoin
              </Typography>
              <ToggleButtonGroup
                value={timePeriod}
                exclusive
                onChange={handleTimePeriodChange}
                aria-label="time period"
                size="small"
              >
                <ToggleButton value="month" aria-label="month">
                  Month
                </ToggleButton>
                <ToggleButton value="quarter" aria-label="quarter">
                  Quarter
                </ToggleButton>
                <ToggleButton value="year" aria-label="year">
                  Year
                </ToggleButton>
                <ToggleButton value="all" aria-label="all time">
                  All
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TextField
                label={getStartBalanceLabel(timePeriod)}
                type="number"
                value={getCurrentStartBalance(timePeriod)}
                onChange={handleStartBalanceChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                size="small"
                sx={{ width: '300px' }}
              />
              <Tooltip title={`Enter the amount you would have invested in Bitcoin at the start of the ${getPeriodLabel(timePeriod).toLowerCase()} period to compare with your actual trading performance`}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              {stats.totalTrades > 0 ? (
                <Bar 
                  data={profitComparisonData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    No trade data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Detailed Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Detailed Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Trading Performance</Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Average Profit:</Typography>
                  <Typography color="success.main">${stats.averageProfit.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Average Loss:</Typography>
                  <Typography color="error.main">${stats.averageLoss.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Active Trades:</Typography>
                  <Typography>{trades.filter(t => t.isActive).length}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Portfolio Value:</Typography>
                  <Typography>${portfolioValue.toFixed(2)}</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  Bitcoin Comparison ({getPeriodLabel(timePeriod)})
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Trading Profit:</Typography>
                  <Typography color={btcComparison.tradingProfit >= 0 ? 'success.main' : 'error.main'}>
                    ${btcComparison.tradingProfit.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Bitcoin Holding Profit:</Typography>
                  <Typography color={btcComparison.holdingProfit >= 0 ? 'success.main' : 'error.main'}>
                    ${btcComparison.holdingProfit.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Difference:</Typography>
                  <Typography color={btcComparison.difference >= 0 ? 'success.main' : 'error.main'}>
                    ${btcComparison.difference.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Percentage Difference:</Typography>
                  <Typography color={btcComparison.percentageDifference >= 0 ? 'success.main' : 'error.main'}>
                    {btcComparison.percentageDifference.toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                  <Typography>Start Balance ({getPeriodLabel(timePeriod)}):</Typography>
                  <Typography>${getCurrentStartBalance(timePeriod).toFixed(2)}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 