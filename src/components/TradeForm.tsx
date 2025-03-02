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
import { useTrades, usePortfolio } from '../context/TradeContext';
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
    calculatePositionFromDollarRisk
  } = useTrades();
  
  // Use the global portfolio value from the usePortfolio hook
  const { portfolioValue, setPortfolioValue } = usePortfolio();
  
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [customCoin, setCustomCoin] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [quantityType, setQuantityType] = useState<'dollars' | 'coins'>('dollars');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [lessonsLearned, setLessonsLearned] = useState<string>('');
  const [risk, setRisk] = useState<number | null>(null);
  const [desiredRisk, setDesiredRisk] = useState<string>('2');
  const [dollarRisk, setDollarRisk] = useState<string>('200');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [isRiskInputMode, setIsRiskInputMode] = useState<boolean>(false);
  const [calculationTarget, setCalculationTarget] = useState<'position' | 'stopLoss'>('position');
  const [riskTabValue, setRiskTabValue] = useState<number>(0);
  const [fees, setFees] = useState<string>('0.1'); // Default trading fee of 0.1%
  const [feesType, setFeesType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  
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
          // Format the price to display full decimal instead of scientific notation
          setEntryPrice(price.toString().includes('e') ? 
            Number(price).toFixed(20).replace(/\.?0+$/, '') : 
            price.toString());
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
      const feesNum = parseFloat(fees);
      
      if (!isNaN(entryPriceNum) && !isNaN(stopLossNum) && !isNaN(quantityNum)) {
        // Include fees in risk calculation
        const positionSizeDollars = quantityType === 'dollars' 
          ? quantityNum 
          : quantityNum * entryPriceNum;
        
        // Calculate fee amount based on fee type
        const feeAmount = feesType === 'percentage'
          ? (positionSizeDollars * feesNum) / 100
          : feesNum; // Fixed dollar amount
        
        // Calculate risk including fees
        const calculatedRisk = calculateRisk(
          entryPriceNum, 
          stopLossNum, 
          quantityNum, 
          quantityType, 
          portfolioValue,
          isShort
        );
        
        // Add fee impact to risk
        const riskWithFees = calculatedRisk + ((feeAmount / portfolioValue) * 100);
        
        setRisk(riskWithFees);
      } else {
        setRisk(null);
      }
    } else if (isRiskInputMode && entryPrice && stopLoss && quantity && portfolioValue) {
      // Also calculate risk when in risk input mode
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossNum = parseFloat(stopLoss);
      const quantityNum = parseFloat(quantity);
      const feesNum = parseFloat(fees);
      
      if (!isNaN(entryPriceNum) && !isNaN(stopLossNum) && !isNaN(quantityNum)) {
        // Include fees in risk calculation
        const positionSizeDollars = quantityType === 'dollars' 
          ? quantityNum 
          : quantityNum * entryPriceNum;
        
        // Calculate fee amount based on fee type
        const feeAmount = feesType === 'percentage'
          ? (positionSizeDollars * feesNum) / 100
          : feesNum; // Fixed dollar amount
        
        // Calculate risk including fees
        const calculatedRisk = calculateRisk(
          entryPriceNum, 
          stopLossNum, 
          quantityNum, 
          quantityType, 
          portfolioValue,
          isShort
        );
        
        // Add fee impact to risk
        const riskWithFees = calculatedRisk + ((feeAmount / portfolioValue) * 100);
        
        setRisk(riskWithFees);
      } else {
        setRisk(null);
      }
    } else {
      setRisk(null);
    }
  }, [entryPrice, stopLoss, quantity, quantityType, portfolioValue, calculateRisk, isRiskInputMode, isShort, fees, feesType]);
  
  // Helper function to format numbers to avoid scientific notation
  const formatFullDecimal = (num: number): string => {
    if (num === 0) return '0';
    
    // Convert to string and check if it uses scientific notation
    const numStr = num.toString();
    if (!numStr.includes('e')) return numStr;
    
    // Handle scientific notation
    return Number(num).toFixed(20).replace(/\.?0+$/, '');
  };
  
  // Calculate position size or stop loss based on desired risk
  useEffect(() => {
    if (isRiskInputMode && riskTabValue === 0 && desiredRisk && portfolioValue) {
      const riskPercentage = parseFloat(desiredRisk);
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossNum = parseFloat(stopLoss);
      const feesNum = parseFloat(fees);
      
      // Add debug logging
      console.log('Risk calculation inputs:', {
        calculationTarget,
        riskPercentage,
        entryPriceNum,
        stopLossNum,
        quantity: parseFloat(quantity),
        portfolioValue,
        quantityType,
        isShort,
        feesNum,
        feesType
      });
      
      if (!isNaN(riskPercentage) && !isNaN(feesNum)) {
        if (calculationTarget === 'position' && !isNaN(entryPriceNum) && !isNaN(stopLossNum) && entryPriceNum !== stopLossNum) {
          // Calculate position size based on risk percentage
          const calculatedPosition = calculatePositionFromRisk(
            entryPriceNum,
            stopLossNum,
            riskPercentage,
            portfolioValue,
            quantityType,
            isShort,
            feesNum,
            feesType
          );
          
          console.log('Calculated position:', calculatedPosition);
          
          if (calculatedPosition > 0) {
            setQuantity(formatFullDecimal(calculatedPosition));
          }
        } else if (calculationTarget === 'stopLoss' && !isNaN(entryPriceNum) && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0) {
          // Calculate stop loss based on risk percentage
          const quantityNum = parseFloat(quantity);
          const calculatedStopLoss = calculateStopLossFromRisk(
            entryPriceNum,
            quantityNum,
            riskPercentage,
            portfolioValue,
            quantityType,
            isShort,
            feesNum,
            feesType
          );
          
          console.log('Calculated stop loss:', calculatedStopLoss);
          
          if (calculatedStopLoss > 0) {
            setStopLoss(formatFullDecimal(calculatedStopLoss));
          }
        }
      }
    } else if (isRiskInputMode && riskTabValue === 1 && dollarRisk && portfolioValue) {
      const riskAmount = parseFloat(dollarRisk);
      const entryPriceNum = parseFloat(entryPrice);
      const stopLossNum = parseFloat(stopLoss);
      const feesNum = parseFloat(fees);
      
      // Add debug logging
      console.log('Dollar risk calculation inputs:', {
        riskAmount,
        entryPriceNum,
        stopLossNum,
        portfolioValue,
        quantityType,
        isShort,
        feesNum,
        feesType
      });
      
      if (!isNaN(riskAmount) && !isNaN(entryPriceNum) && !isNaN(stopLossNum) && !isNaN(feesNum) && entryPriceNum !== stopLossNum) {
        if (calculationTarget === 'position') {
          // Calculate position size based on dollar risk
          const calculatedPosition = calculatePositionFromDollarRisk(
            entryPriceNum,
            stopLossNum,
            riskAmount,
            quantityType,
            isShort,
            feesNum,
            feesType
          );
          
          console.log('Calculated position from dollar risk:', calculatedPosition);
          
          if (calculatedPosition > 0) {
            setQuantity(formatFullDecimal(calculatedPosition));
          }
        }
      }
    }
  }, [
    isRiskInputMode, 
    riskTabValue,
    desiredRisk, 
    dollarRisk,
    entryPrice, 
    stopLoss, 
    quantity,
    portfolioValue, 
    calculationTarget, 
    quantityType, 
    calculatePositionFromRisk, 
    calculateStopLossFromRisk,
    calculatePositionFromDollarRisk,
    isShort,
    fees,
    feesType
  ]);
  
  // Add a separate useEffect to recalculate when fees change while in risk input mode
  useEffect(() => {
    // Only trigger recalculation if we're in risk input mode and have the necessary values
    if (isRiskInputMode && entryPrice && portfolioValue) {
      if (riskTabValue === 0 && desiredRisk) {
        const riskPercentage = parseFloat(desiredRisk);
        const entryPriceNum = parseFloat(entryPrice);
        const feesNum = parseFloat(fees);
        
        if (!isNaN(riskPercentage) && !isNaN(feesNum) && !isNaN(entryPriceNum)) {
          if (calculationTarget === 'position' && stopLoss && !isNaN(parseFloat(stopLoss)) && entryPriceNum !== parseFloat(stopLoss)) {
            // Recalculate position size when fees change
            const stopLossNum = parseFloat(stopLoss);
            const calculatedPosition = calculatePositionFromRisk(
              entryPriceNum,
              stopLossNum,
              riskPercentage,
              portfolioValue,
              quantityType,
              isShort,
              feesNum,
              feesType
            );
            
            console.log('Recalculated position after fee change:', calculatedPosition);
            
            if (calculatedPosition > 0) {
              setQuantity(formatFullDecimal(calculatedPosition));
            }
          } else if (calculationTarget === 'stopLoss' && quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0) {
            // Recalculate stop loss when fees change
            const quantityNum = parseFloat(quantity);
            const calculatedStopLoss = calculateStopLossFromRisk(
              entryPriceNum,
              quantityNum,
              riskPercentage,
              portfolioValue,
              quantityType,
              isShort,
              feesNum,
              feesType
            );
            
            console.log('Recalculated stop loss after fee change:', calculatedStopLoss);
            
            if (calculatedStopLoss > 0) {
              setStopLoss(formatFullDecimal(calculatedStopLoss));
            }
          }
        }
      } else if (riskTabValue === 1 && dollarRisk && stopLoss && entryPrice) {
        // Recalculate position size based on dollar risk when fees change
        const riskAmount = parseFloat(dollarRisk);
        const entryPriceNum = parseFloat(entryPrice);
        const stopLossNum = parseFloat(stopLoss);
        const feesNum = parseFloat(fees);
        
        if (!isNaN(riskAmount) && !isNaN(entryPriceNum) && !isNaN(stopLossNum) && !isNaN(feesNum) && entryPriceNum !== stopLossNum) {
          const calculatedPosition = calculatePositionFromDollarRisk(
            entryPriceNum,
            stopLossNum,
            riskAmount,
            quantityType,
            isShort,
            feesNum,
            feesType
          );
          
          console.log('Recalculated position from dollar risk after fee change:', calculatedPosition);
          
          if (calculatedPosition > 0) {
            setQuantity(formatFullDecimal(calculatedPosition));
          }
        }
      }
    }
  }, [
    fees, 
    feesType, 
    isRiskInputMode,
    calculationTarget,
    riskTabValue,
    desiredRisk,
    dollarRisk,
    entryPrice,
    stopLoss,
    quantity,
    portfolioValue,
    quantityType,
    isShort,
    calculatePositionFromRisk,
    calculateStopLossFromRisk,
    calculatePositionFromDollarRisk
  ]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const entryPriceNum = parseFloat(entryPrice);
    const stopLossNum = parseFloat(stopLoss);
    const quantityNum = parseFloat(quantity);
    const feesNum = parseFloat(fees);
    
    if (isNaN(entryPriceNum) || isNaN(stopLossNum) || isNaN(quantityNum)) {
      setAlertMessage('Please enter valid numbers for price, quantity, and stop loss.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    if (isNaN(feesNum) || feesNum < 0) {
      setAlertMessage('Please enter a valid number for fees.');
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
      name: name,
      entryPrice: entryPriceNum,
      quantity: quantityNum,
      quantityType,
      stopLoss: stopLossNum,
      entryDate: new Date(`${entryDate}T00:00:00`).toISOString(),
      notes,
      lessonsLearned,
      fees: feesNum,
      feesType
    });
    
    // Reset form
    setSelectedCoin(null);
    setCustomCoin('');
    setName('');
    setEntryPrice('');
    setQuantity('');
    setStopLoss('');
    setNotes('');
    setLessonsLearned('');
    setEntryDate(new Date().toISOString().split('T')[0]);
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
                label="Trade Name (Optional)"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., BTC Breakout, ETH Support Bounce"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entry Date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entry Price"
                type="text"
                value={entryPrice}
                onChange={(e) => {
                  // Ensure we're storing the full decimal representation
                  const value = e.target.value;
                  setEntryPrice(value);
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
                inputProps={{
                  step: "any" // Allows any decimal precision
                }}
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
                  InputProps={{
                    endAdornment: isRiskInputMode && (calculationTarget === 'position' || riskTabValue === 1) ? (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                          Auto
                        </Typography>
                      </InputAdornment>
                    ) : undefined,
                  }}
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
                type="text"
                value={stopLoss}
                onChange={(e) => {
                  // Ensure we're storing the full decimal representation
                  const value = e.target.value;
                  setStopLoss(value);
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: isRiskInputMode && calculationTarget === 'stopLoss' && riskTabValue === 0 ? (
                    <InputAdornment position="end">
                      <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        Auto
                      </Typography>
                    </InputAdornment>
                  ) : undefined,
                }}
                required
                helperText={isShort ? 'For short positions, stop loss should be higher than entry price' : 'For long positions, stop loss should be lower than entry price'}
                disabled={isRiskInputMode && calculationTarget === 'stopLoss' && riskTabValue === 0}
                inputProps={{
                  step: "any" // Allows any decimal precision
                }}
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
                helperText="Portfolio value is automatically calculated based on your trade history"
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
                      helperText="Portfolio value is automatically calculated based on your trade history"
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
                        if (isNaN(entryPriceNum) || isNaN(stopLossNum) || entryPriceNum === 0) return '';
                        const percentage = Math.abs((entryPriceNum - stopLossNum) / entryPriceNum * 100);
                        return percentage.toFixed(2);
                      })()}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) || 0;
                        if (entryPrice) {
                          const entryPriceNum = parseFloat(entryPrice);
                          if (!isNaN(entryPriceNum) && entryPriceNum !== 0) {
                            const newStopLoss = isShort 
                              ? entryPriceNum * (1 + percentage / 100)
                              : entryPriceNum * (1 - percentage / 100);
                            
                            // Format to display full decimal instead of scientific notation
                            setStopLoss(newStopLoss.toString().includes('e') ? 
                              Number(newStopLoss).toFixed(20).replace(/\.?0+$/, '') : 
                              newStopLoss.toString());
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
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">{feesType === 'percentage' ? '%' : '$'}</InputAdornment>,
                      }}
                      helperText={isRiskInputMode ? 
                        `Position size or stop loss will automatically update to maintain ${riskTabValue === 0 ? desiredRisk + '%' : '$' + dollarRisk} risk` : 
                        undefined}
                    />
                    <ToggleButtonGroup
                      value={feesType}
                      exclusive
                      onChange={(e, value) => value && setFeesType(value)}
                      aria-label="fees type"
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      <ToggleButton value="percentage" aria-label="percentage">
                        Percentage
                      </ToggleButton>
                      <ToggleButton value="fixed" aria-label="fixed amount">
                        Fixed $
                      </ToggleButton>
                    </ToggleButtonGroup>
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
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            const totalRisk = dollarRisk + feeAmount;
                            const equityRisk = (totalRisk / portfolioValue) * 100;
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
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            const totalRisk = dollarRisk + feeAmount;
                            return `$${totalRisk.toFixed(2)} (incl. $${feeAmount.toFixed(2)} fees)`;
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
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            const totalRisk = dollarRisk + feeAmount;
                            const twoRDollar = totalRisk * 2;
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
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            const totalRisk = dollarRisk + feeAmount;
                            const threeRDollar = totalRisk * 3;
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
                      
                      {/* Add validation messages */}
                      <Grid item xs={12}>
                        {calculationTarget === 'position' && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <strong>To calculate position size:</strong> Enter your entry price, stop loss, and desired risk percentage. 
                            {isShort ? 
                              ' For short positions, stop loss must be higher than entry price.' : 
                              ' For long positions, stop loss must be lower than entry price.'}
                          </Alert>
                        )}
                        
                        {calculationTarget === 'stopLoss' && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <strong>To calculate stop loss:</strong> Enter your entry price, position size, and desired risk percentage.
                            {isShort ? 
                              ' For short positions, stop loss will be calculated above your entry price.' : 
                              ' For long positions, stop loss will be calculated below your entry price.'}
                          </Alert>
                        )}
                        
                        {/* Show validation errors */}
                        {calculationTarget === 'position' && entryPrice && stopLoss && (
                          <>
                            {isShort && parseFloat(stopLoss) <= parseFloat(entryPrice) && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                For short positions, stop loss must be higher than entry price.
                              </Alert>
                            )}
                            {!isShort && parseFloat(stopLoss) >= parseFloat(entryPrice) && (
                              <Alert severity="error" sx={{ mt: 1 }}>
                                For long positions, stop loss must be lower than entry price.
                              </Alert>
                            )}
                          </>
                        )}
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
                    
                    {/* Add validation messages */}
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <strong>To calculate position size from dollar risk:</strong> Enter your entry price, stop loss, and dollar risk amount.
                      {isShort ? 
                        ' For short positions, stop loss must be higher than entry price.' : 
                        ' For long positions, stop loss must be lower than entry price.'}
                    </Alert>
                    
                    {/* Show validation errors */}
                    {entryPrice && stopLoss && (
                      <>
                        {isShort && parseFloat(stopLoss) <= parseFloat(entryPrice) && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            For short positions, stop loss must be higher than entry price.
                          </Alert>
                        )}
                        {!isShort && parseFloat(stopLoss) >= parseFloat(entryPrice) && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            For long positions, stop loss must be lower than entry price.
                          </Alert>
                        )}
                      </>
                    )}
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lessons Learned"
                multiline
                rows={3}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
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
                          {(() => {
                            const entryPriceNum = parseFloat(entryPrice);
                            const stopLossNum = parseFloat(stopLoss);
                            const priceDiff = Math.abs(entryPriceNum - stopLossNum);
                            
                            // Determine appropriate decimal places based on price
                            const decimalPlaces = entryPriceNum < 0.0001 ? 12 : 
                                                 entryPriceNum < 0.01 ? 8 : 
                                                 entryPriceNum < 1 ? 6 : 2;
                            
                            return `$${priceDiff.toFixed(decimalPlaces)} (${((priceDiff / entryPriceNum) * 100).toFixed(2)}%)`;
                          })()}
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
                            const entryPriceNum = parseFloat(entryPrice);
                            const stopLossNum = parseFloat(stopLoss);
                            const actualQuantity = quantityType === 'dollars' 
                              ? parseFloat(quantity) / entryPriceNum 
                              : parseFloat(quantity);
                            const slRisk = Math.abs(entryPriceNum - stopLossNum) * actualQuantity;
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * entryPriceNum;
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            return (slRisk + feeAmount).toFixed(2);
                          })()}
                          {feesType === 'percentage' ? ` (${fees}%)` : ' (fixed)'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Trading Fees:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ${(() => {
                            const entryPriceNum = parseFloat(entryPrice);
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * entryPriceNum;
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            return feeAmount.toFixed(2);
                          })()}
                          {feesType === 'percentage' ? ` (${fees}%)` : ' (fixed)'}
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
                            const entryPriceNum = parseFloat(entryPrice);
                            const stopLossNum = parseFloat(stopLoss);
                            const actualQuantity = quantityType === 'dollars' 
                              ? parseFloat(quantity) / entryPriceNum 
                              : parseFloat(quantity);
                            const slRisk = Math.abs(entryPriceNum - stopLossNum) * actualQuantity;
                            const positionSizeDollars = quantityType === 'dollars' 
                              ? parseFloat(quantity) 
                              : parseFloat(quantity) * entryPriceNum;
                            const feeAmount = feesType === 'percentage'
                              ? (positionSizeDollars * parseFloat(fees)) / 100
                              : parseFloat(fees);
                            return (slRisk + feeAmount).toFixed(2);
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