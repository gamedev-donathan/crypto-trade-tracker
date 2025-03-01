import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider,
  Tooltip,
  IconButton,
  Card,
  CardContent
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { usePortfolio, useTrades } from '../context/TradeContext';

const PortfolioSummary: React.FC = () => {
  const { portfolioValue } = usePortfolio();
  const { getTradeStats, calculateCurrentPortfolioValue } = useTrades();
  
  const stats = getTradeStats();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5">Portfolio Summary</Typography>
        </Box>
        <Tooltip title="Portfolio value is automatically calculated based on your trade history">
          <IconButton size="small">
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Current Portfolio Value</Typography>
              <Typography variant="h4">{formatCurrency(portfolioValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Total Profit/Loss</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h4" color={stats.totalProfit >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(stats.totalProfit)}
                </Typography>
                {stats.totalProfit >= 0 ? (
                  <TrendingUpIcon sx={{ ml: 1, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ ml: 1, color: 'error.main' }} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Win Rate</Typography>
              <Typography variant="h4">
                {stats.winRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({stats.winningTrades} wins / {stats.losingTrades} losses)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
        <Typography variant="body2" color="text.secondary">
          Your portfolio value is automatically updated based on your trade history. 
          It includes profits and losses from all closed trades and partial exits.
        </Typography>
      </Box>
    </Paper>
  );
};

export default PortfolioSummary; 