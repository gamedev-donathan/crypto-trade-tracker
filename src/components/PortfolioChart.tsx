import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  TextField,
  InputAdornment,
  Button,
  useTheme,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useTrades, usePortfolio } from '../context/TradeContext';
import { PortfolioPerformance } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const PortfolioChart: React.FC = () => {
  const { 
    getPortfolioPerformance, 
    portfolioSettings, 
    setPortfolioSettings 
  } = useTrades();
  
  // Use the global portfolio value from the usePortfolio hook if needed
  const { portfolioValue } = usePortfolio();
  
  const theme = useTheme();
  
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');
  
  // Get performance data
  const performanceData = getPortfolioPerformance();
  
  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    if (timeRange === 'all' || performanceData.length === 0) {
      return performanceData;
    }
    
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === '1m') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '3m') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === '6m') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (timeRange === '1y') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return performanceData.filter(item => new Date(item.date) >= startDate);
  }, [performanceData, timeRange]);
  
  // Handle portfolio start date change
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPortfolioSettings({
      ...portfolioSettings,
      startDate: event.target.value
    });
  };
  
  // Handle initial balance change
  const handleInitialBalanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value >= 0) {
      setPortfolioSettings({
        ...portfolioSettings,
        initialBalance: value
      });
    }
  };
  
  // Handle time range change
  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: '1m' | '3m' | '6m' | '1y' | 'all' | null,
  ) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };
  
  // Prepare chart data
  const chartData = {
    labels: filteredData.map(item => item.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: filteredData.map(item => item.portfolioValue),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '40', // Add transparency
        fill: true,
        tension: 0.4,
        pointRadius: filteredData.length > 60 ? 0 : 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Cumulative Profit',
        data: filteredData.map(item => item.cumulativeProfit),
        borderColor: theme.palette.success.main,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
      }
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          tooltipFormat: 'MMM d, yyyy',
          displayFormats: {
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value ($)'
        },
        beginAtZero: false
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };
  
  // Calculate performance metrics
  const startValue = filteredData.length > 0 ? filteredData[0].portfolioValue : 0;
  const currentValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].portfolioValue : 0;
  const totalGrowth = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Portfolio Performance
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Portfolio Start Date"
            type="date"
            value={portfolioSettings.startDate}
            onChange={handleStartDateChange}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Initial Balance"
            type="number"
            value={portfolioSettings.initialBalance}
            onChange={handleInitialBalanceChange}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" component="span" sx={{ mr: 2 }}>
            Total Growth: 
          </Typography>
          <Typography 
            variant="h6" 
            component="span" 
            color={totalGrowth >= 0 ? 'success.main' : 'error.main'}
          >
            {totalGrowth.toFixed(2)}%
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          aria-label="time range"
          size="small"
        >
          <ToggleButton value="1m" aria-label="1 month">
            1M
          </ToggleButton>
          <ToggleButton value="3m" aria-label="3 months">
            3M
          </ToggleButton>
          <ToggleButton value="6m" aria-label="6 months">
            6M
          </ToggleButton>
          <ToggleButton value="1y" aria-label="1 year">
            1Y
          </ToggleButton>
          <ToggleButton value="all" aria-label="all time">
            All
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ height: 400 }}>
        {filteredData.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body1" color="textSecondary">
              No performance data available. Add trades to see your portfolio growth.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PortfolioChart; 