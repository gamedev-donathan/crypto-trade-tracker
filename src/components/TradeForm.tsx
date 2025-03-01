import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  InputAdornment,
  Autocomplete,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Divider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab
} from '@mui/material';
import { useTrades } from '../context/TradeContext';
import coinGeckoService, { Coin } from '../services/coinGeckoService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`risk-tabpanel-${index}`}
      aria-labelledby={`risk-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TradeForm: React.FC = () => {
  const { 
    addTrade, 
    calculateRisk, 
    calculatePositionFromRisk,
    calculateStopLossFromRisk,
    calculatePositionFromDollarRisk,
    portfolioValue, 
    setPortfolioValue 
  } = useTrades();
  
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [customCoin, setCustomCoin] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [quantityType, setQuantityType] = useState<'coins' | 'dollars'>('coins');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [risk, setRisk] = useState<number | null>(null);
  const [desiredRisk, setDesiredRisk] = useState<string>('2');
  const [dollarRisk, setDollarRisk] = useState<string>('200');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [isRiskInputMode, setIsRiskInputMode] = useState<boolean>(false);
  const [calculationTarget, setCalculationTarget] = useState<'position' | 'stopLoss'>('position');
  const [riskTabValue, setRiskTabValue] = useState<number>(0);
  
  // For coin search
  const [coins, setCoins] = useState<Coin[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Coin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isShort, setIsShort] = useState<boolean>(false);
  
  // Fetch popular coins on component mount
  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      const fetchedCoins = await coinGeckoService.getCoins();
      setCoins(fetchedCoins);
      setLoading(false);
    };
    
    fetchCoins();
  }, []);
  
  // Handle coin search
  useEffect(() => {
    const searchCoins = async () => {
      if (searchQuery.trim().length > 1) {
        setLoading(true);
        const results = await coinGeckoService.searchCoins(searchQuery);
        setSearchResults(results);
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    };
    
    const timeoutId = setTimeout(() => {
      searchCoins();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  // Update entry price when a coin is selected
  useEffect(() => {
    const updatePrice = async () => {
      if (selectedCoin?.id && !isShort) {
        setLoading(true);
        const price = await coinGeckoService.getCoinPrice(selectedCoin.id);
        if (price) {
          setEntryPrice(price.toString());
        }
        setLoading(false);
      }
    };
    
    updatePrice();
  }, [selectedCoin, isShort]);
  
  // Calculate risk when relevant fields change
  useEffect(() => {
    if (!isRiskInputMode && entryPrice && stopLoss && quantity && portfolioValue) {
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossNum = parseFloat(stopLoss);
      const quantityNum = parseFloat(quantity);
      
      if (!isNaN(entryPriceNum) && !isNaN(stopLossNum) && !isNaN(quantityNum)) {
        const calculatedRisk = calculateRisk(
          entryPriceNum, 
          stopLossNum, 
          quantityNum, 
          quantityType, 
          portfolioValue,
          isShort
        );
        setRisk(calculatedRisk);
      } else {
        setRisk(null);
      }
    }
  }, [entryPrice, stopLoss, quantity, quantityType, portfolioValue, calculateRisk, isRiskInputMode, isShort]);
  
  // Calculate position size or stop loss based on desired risk
  useEffect(() => {
    if (isRiskInputMode && riskTabValue === 0 && desiredRisk && portfolioValue) {
      const desiredRiskNum = parseFloat(desiredRisk);
      
      if (calculationTarget === 'position' && entryPrice && stopLoss) {
        const entryPriceNum = parseFloat(entryPrice);
        const stopLossNum = parseFloat(stopLoss);
        
        if (!isNaN(desiredRiskNum) && !isNaN(entryPriceNum) && !isNaN(stopLossNum)) {
          const calculatedPosition = calculatePositionFromRisk(
            entryPriceNum,
            stopLossNum,
            desiredRiskNum,
            portfolioValue,
            quantityType,
            isShort
          );
          
          setQuantity(calculatedPosition.toFixed(quantityType === 'coins' ? 8 : 2));
          setRisk(desiredRiskNum);
        }
      } else if (calculationTarget === 'stopLoss' && entryPrice && quantity) {
        const entryPriceNum = parseFloat(entryPrice);
        const quantityNum = parseFloat(quantity);
        
        if (!isNaN(desiredRiskNum) && !isNaN(entryPriceNum) && !isNaN(quantityNum)) {
          const calculatedStopLoss = calculateStopLossFromRisk(
            entryPriceNum,
            quantityNum,
            desiredRiskNum,
            portfolioValue,
            quantityType,
            isShort
          );
          
          setStopLoss(calculatedStopLoss.toFixed(2));
          setRisk(desiredRiskNum);
        }
      }
    }
  }, [
    isRiskInputMode,
    riskTabValue,
    desiredRisk, 
    calculationTarget, 
    entryPrice, 
    stopLoss, 
    quantity, 
    portfolioValue, 
    quantityType, 
    calculatePositionFromRisk, 
    calculateStopLossFromRisk,
    isShort
  ]);
  
  // Calculate position size based on dollar risk
  useEffect(() => {
    if (isRiskInputMode && riskTabValue === 1 && dollarRisk && entryPrice && stopLoss) {
      const dollarRiskNum = parseFloat(dollarRisk);
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossNum = parseFloat(stopLoss);
      
      if (!isNaN(dollarRiskNum) && !isNaN(entryPriceNum) && !isNaN(stopLossNum)) {
        const calculatedPosition = calculatePositionFromDollarRisk(
          entryPriceNum,
          stopLossNum,
          dollarRiskNum,
          quantityType,
          isShort
        );
        
        setQuantity(calculatedPosition.toFixed(quantityType === 'coins' ? 8 : 2));
        
        // Calculate the risk percentage
        if (portfolioValue > 0) {
          setRisk((dollarRiskNum / portfolioValue) * 100);
        }
      }
    }
  }, [
    isRiskInputMode,
    riskTabValue,
    dollarRisk,
    entryPrice,
    stopLoss,
    quantityType,
    calculatePositionFromDollarRisk,
    portfolioValue,
    isShort
  ]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const entryPriceNum = parseFloat(entryPrice);
    const stopLossNum = parseFloat(stopLoss);
    const quantityNum = parseFloat(quantity);
    
    if (isNaN(entryPriceNum) || isNaN(stopLossNum) || isNaN(quantityNum)) {
      setAlertMessage('Please enter valid numbers for price, quantity, and stop loss.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // For long positions, stop loss should be lower than entry price
    // For short positions, stop loss should be higher than entry price
    if (!isShort && stopLossNum >= entryPriceNum) {
      setAlertMessage('For long positions, stop loss must be lower than entry price.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    } else if (isShort && stopLossNum <= entryPriceNum) {
      setAlertMessage('For short positions, stop loss must be higher than entry price.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Determine cryptocurrency name
    const cryptoName = isShort 
      ? `Short ${selectedCoin ? selectedCoin.name : customCoin}` 
      : selectedCoin ? selectedCoin.name : customCoin;
    
    if (!cryptoName) {
      setAlertMessage('Please select a cryptocurrency or enter a custom one.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Add the trade
    addTrade({
      cryptocurrency: cryptoName,
      coinId: selectedCoin ? selectedCoin.id : customCoin.toLowerCase().replace(/\s+/g, '-'),
      entryPrice: entryPriceNum,
      quantity: quantityNum,
      quantityType,
      stopLoss: stopLossNum,
      entryDate: new Date().toISOString(),
      notes
    });
    
    // Reset form
    setSelectedCoin(null);
    setCustomCoin('');
    setEntryPrice('');
    setQuantity('');
    setStopLoss('');
    setNotes('');
    setIsShort(false);
    
    // Show success message
    setAlertMessage('Trade added successfully!');
    setAlertSeverity('success');
    setShowAlert(true);
  };
  
  const handleQuantityTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'coins' | 'dollars' | null,
  ) => {
    if (newType !== null) {
      setQuantityType(newType);
    }
  };
  
  const handleCalculationTargetChange = (
    event: React.MouseEvent<HTMLElement>,
    newTarget: 'position' | 'stopLoss' | null,
  ) => {
    if (newTarget !== null) {
      setCalculationTarget(newTarget);
    }
  };
  
  const handleRiskTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setRiskTabValue(newValue);
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Trade
      </Typography>
      
      {showAlert && (
        <Alert 
          severity={alertSeverity} 
          onClose={() => setShowAlert(false)}
          sx={{ mb: 2 }}
        >
          {alertMessage}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Position Type */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <ToggleButtonGroup
                  value={isShort ? 'short' : 'long'}
                  exclusive
                  onChange={(e, value) => setIsShort(value === 'short')}
                  aria-label="position type"
                >
                  <ToggleButton value="long" aria-label="long position">
                    Long Position
                  </ToggleButton>
                  <ToggleButton value="short" aria-label="short position">
                    Short Position
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormControl>
            </Grid>
            
            {/* Cryptocurrency Selection */}
            <Grid item xs={12}>
              <Autocomplete<Coin, false, false, true>
                id="cryptocurrency-select"
                options={searchQuery ? searchResults : coins}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    return option;
                  }
                  return `${option.name} (${option.symbol.toUpperCase()})`;
                }}
                loading={loading}
                value={selectedCoin}
                onChange={(event, value) => {
                  if (value && typeof value !== 'string') {
                    setSelectedCoin(value);
                    setCustomCoin('');
                  } else {
                    setSelectedCoin(null);
                  }
                }}
                onInputChange={(event, newInputValue) => {
                  setSearchQuery(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Cryptocurrency"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {option.image && (
                        <Avatar 
                          src={option.image} 
                          alt={option.name}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                      )}
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({option.symbol.toUpperCase()})
                      </Typography>
                    </Box>
                  </li>
                )}
                freeSolo
              />
            </Grid>
            
            {/* Custom Cryptocurrency */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Or Enter Custom Cryptocurrency"
                value={customCoin}
                onChange={(e) => {
                  setCustomCoin(e.target.value);
                  if (e.target.value) {
                    setSelectedCoin(null);
                  }
                }}
                helperText="If your cryptocurrency is not in the list, you can enter it manually"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entry Price"
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  sx={{ mb: 1 }}
                  disabled={isRiskInputMode && (calculationTarget === 'position' || riskTabValue === 1)}
                />
                <ToggleButtonGroup
                  value={quantityType}
                  exclusive
                  onChange={handleQuantityTypeChange}
                  aria-label="quantity type"
                  size="small"
                >
                  <ToggleButton value="coins" aria-label="coins">
                    Coins
                  </ToggleButton>
                  <ToggleButton value="dollars" aria-label="dollars">
                    Dollars
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stop Loss"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
                helperText={isShort ? 'For short positions, stop loss should be higher than entry price' : 'For long positions, stop loss should be lower than entry price'}
                disabled={isRiskInputMode && calculationTarget === 'stopLoss' && riskTabValue === 0}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Portfolio Value"
                type="number"
                value={portfolioValue}
                onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Risk Management
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Risk Calculator
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Account Size"
                      type="number"
                      value={portfolioValue}
                      onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Position Size"
                      type="number"
                      value={quantityType === 'dollars' ? quantity : (parseFloat(quantity || '0') * parseFloat(entryPrice || '0')).toString()}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        if (quantityType === 'dollars') {
                          setQuantity(value.toString());
                        } else if (parseFloat(entryPrice) > 0) {
                          setQuantity((value / parseFloat(entryPrice)).toString());
                        }
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Stop Loss %"
                      type="number"
                      value={(() => {
                        if (!entryPrice || !stopLoss) return '';
                        const entryPriceNum = parseFloat(entryPrice);
                        const stopLossNum = parseFloat(stopLoss);
                        if (isNaN(entryPriceNum) || isNaN(stopLossNum)) return '';
                        const percentage = Math.abs((entryPriceNum - stopLossNum) / entryPriceNum * 100);
                        return percentage.toFixed(2);
                      })()}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) || 0;
                        if (entryPrice) {
                          const entryPriceNum = parseFloat(entryPrice);
                          if (!isNaN(entryPriceNum)) {
                            const newStopLoss = isShort 
                              ? entryPriceNum * (1 + percentage / 100)
                              : entryPriceNum * (1 - percentage / 100);
                            setStopLoss(newStopLoss.toFixed(2));
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Fees"
                      type="number"
                      value="0"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      disabled
                    />
                  </Grid>
                </Grid>
                
                {entryPrice && stopLoss && quantity && portfolioValue && (
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      mt: 2, 
                      p: 2, 
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Equity Risk:
                        </Typography>
                        <Typography variant="h6">
                          {(() => {
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * parseFloat(entryPrice);
                            const stopLossPercentage = Math.abs((parseFloat(entryPrice) - parseFloat(stopLoss)) / parseFloat(entryPrice));
                            const dollarRisk = positionSizeDollars * stopLossPercentage;
                            const equityRisk = (dollarRisk / portfolioValue) * 100;
                            return `${equityRisk.toFixed(2)}%`;
                          })()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Position Size (%):
                        </Typography>
                        <Typography variant="h6">
                          {(() => {
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * parseFloat(entryPrice);
                            return `${((positionSizeDollars / portfolioValue) * 100).toFixed(2)}%`;
                          })()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Dollar Risk:
                        </Typography>
                        <Typography variant="h6">
                          {(() => {
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * parseFloat(entryPrice);
                            const stopLossPercentage = Math.abs((parseFloat(entryPrice) - parseFloat(stopLoss)) / parseFloat(entryPrice));
                            const dollarRisk = positionSizeDollars * stopLossPercentage;
                            return `$${dollarRisk.toFixed(2)}`;
                          })()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          2R Potential:
                        </Typography>
                        <Typography variant="h6">
                          {(() => {
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * parseFloat(entryPrice);
                            const stopLossPercentage = Math.abs((parseFloat(entryPrice) - parseFloat(stopLoss)) / parseFloat(entryPrice));
                            const dollarRisk = positionSizeDollars * stopLossPercentage;
                            const twoRDollar = dollarRisk * 2;
                            const twoRPercent = (twoRDollar / portfolioValue) * 100;
                            return `${twoRPercent.toFixed(2)}% ($${twoRDollar.toFixed(2)})`;
                          })()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          3R Potential:
                        </Typography>
                        <Typography variant="h6">
                          {(() => {
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * parseFloat(entryPrice);
                            const stopLossPercentage = Math.abs((parseFloat(entryPrice) - parseFloat(stopLoss)) / parseFloat(entryPrice));
                            const dollarRisk = positionSizeDollars * stopLossPercentage;
                            const threeRDollar = dollarRisk * 3;
                            const threeRPercent = (threeRDollar / portfolioValue) * 100;
                            return `${threeRPercent.toFixed(2)}% ($${threeRDollar.toFixed(2)})`;
                          })()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={isRiskInputMode}
                    onChange={(e) => setIsRiskInputMode(e.target.checked)}
                  />
                }
                label="Calculate position size or stop loss from risk"
              />
              
              {isRiskInputMode && (
                <Box sx={{ mt: 2 }}>
                  <Tabs 
                    value={riskTabValue} 
                    onChange={handleRiskTabChange}
                    aria-label="risk calculation tabs"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab label="Risk Percentage" id="risk-tab-0" aria-controls="risk-tabpanel-0" />
                    <Tab label="Dollar Risk" id="risk-tab-1" aria-controls="risk-tabpanel-1" />
                  </Tabs>
                  
                  <TabPanel value={riskTabValue} index={0}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Desired Risk (%)"
                          type="number"
                          value={desiredRisk}
                          onChange={(e) => setDesiredRisk(e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          helperText="Enter your desired risk as a percentage of portfolio"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <ToggleButtonGroup
                          value={calculationTarget}
                          exclusive
                          onChange={handleCalculationTargetChange}
                          aria-label="calculation target"
                          fullWidth
                        >
                          <ToggleButton value="position" aria-label="calculate position">
                            Calculate Position Size
                          </ToggleButton>
                          <ToggleButton value="stopLoss" aria-label="calculate stop loss">
                            Calculate Stop Loss
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Grid>
                    </Grid>
                  </TabPanel>
                  
                  <TabPanel value={riskTabValue} index={1}>
                    <TextField
                      fullWidth
                      label="Dollar Risk Amount"
                      type="number"
                      value={dollarRisk}
                      onChange={(e) => setDollarRisk(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      helperText="Enter the exact dollar amount you're willing to risk on this trade"
                    />
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      This will calculate the position size based on your entry price and stop loss.
                    </Typography>
                  </TabPanel>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  bgcolor: risk && risk > 2 ? 'error.light' : 'success.light'
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Risk Analysis
                </Typography>
                <Typography variant="h5">
                  {risk !== null ? `${risk.toFixed(2)}%` : 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {risk !== null && (
                    risk > 2 
                      ? 'Warning: Risk exceeds 2% of portfolio value!' 
                      : 'Risk is within acceptable limits (≤ 2%)'
                  )}
                </Typography>
                
                {/* Enhanced Risk Analysis */}
                {entryPrice && stopLoss && quantity && portfolioValue && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Detailed Risk Breakdown
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Account Size:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ${parseFloat(portfolioValue.toString()).toLocaleString()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Position Size:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {quantityType === 'dollars' 
                            ? `$${parseFloat(quantity).toLocaleString()}`
                            : `${parseFloat(quantity).toLocaleString()} coins ($${(parseFloat(quantity) * parseFloat(entryPrice)).toLocaleString()})`
                          }
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          % of Account:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          {quantityType === 'dollars'
                            ? `${((parseFloat(quantity) / portfolioValue) * 100).toFixed(2)}%`
                            : `${((parseFloat(quantity) * parseFloat(entryPrice) / portfolioValue) * 100).toFixed(2)}%`
                          }
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Price Change to Stop:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ${Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)).toFixed(2)} 
                          ({((Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) / parseFloat(entryPrice)) * 100).toFixed(2)}%)
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Dollar Risk:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight="bold">
                          ${(() => {
                            const actualQuantity = quantityType === 'dollars' 
                              ? parseFloat(quantity) / parseFloat(entryPrice) 
                              : parseFloat(quantity);
                            return (Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) * actualQuantity).toFixed(2);
                          })()}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          R-Multiple (1R):
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ${(() => {
                            const actualQuantity = quantityType === 'dollars' 
                              ? parseFloat(quantity) / parseFloat(entryPrice) 
                              : parseFloat(quantity);
                            return (Math.abs(parseFloat(entryPrice) - parseFloat(stopLoss)) * actualQuantity).toFixed(2);
                          })()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {quantityType === 'dollars' && entryPrice && quantity && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Equivalent to approximately {(parseFloat(quantity) / parseFloat(entryPrice)).toFixed(8)} coins
                  </Typography>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large"
                fullWidth
              >
                Add Trade
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TradeForm; 