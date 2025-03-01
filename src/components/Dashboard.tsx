import React, { useState } from 'react';
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
import { useTrades } from '../context/TradeContext';
import { TimePeriod } from '../types';

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
  const { trades, getTradeStats, getBitcoinComparison, portfolioValue, yearStartBalance, setYearStartBalance } = useTrades();
  const theme = useTheme();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  
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

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trading Dashboard
      </Typography>
      
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
            
            {timePeriod === 'year' && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label="Portfolio Balance (Jan 1st)"
                  type="number"
                  value={yearStartBalance}
                  onChange={handleYearStartBalanceChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: '250px' }}
                />
                <Tooltip title="Enter your portfolio balance at the start of the year to accurately compare your trading performance with simply holding Bitcoin">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
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
                {timePeriod === 'year' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                    <Typography>Year Start Balance:</Typography>
                    <Typography>${yearStartBalance.toFixed(2)}</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 