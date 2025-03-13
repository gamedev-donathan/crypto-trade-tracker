import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Divider, 
  Paper,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  TextField,
  Button,
  SelectChangeEvent,
  Snackbar,
  Alert
} from '@mui/material';
import AutoSaveSettings from './AutoSaveSettings';
import { useTrades, AppSettings } from '../context/TradeContext';
import { importMostRecentBackup, requestDirectoryPermission } from '../utils/autoImportUtils';

// Extended portfolio settings for the UI
interface ExtendedPortfolioSettings {
  startDate: string;
  initialBalance: number;
  name?: string;
  description?: string;
}

const Settings: React.FC = () => {
  const { 
    portfolioSettings, 
    setPortfolioSettings, 
    appSettings, 
    setAppSettings,
    importTrades,
    setPortfolioValue
  } = useTrades();
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Create extended portfolio settings with optional UI fields
  const [extendedSettings, setExtendedSettings] = useState<ExtendedPortfolioSettings>(() => {
    return {
      ...portfolioSettings,
      name: localStorage.getItem('portfolioName') || '',
      description: localStorage.getItem('portfolioDescription') || ''
    };
  });
  
  // Handle settings changes
  const handleDarkModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAppSettings({
      ...appSettings,
      darkMode: event.target.checked
    });
  };
  
  const handleCurrencyChange = (event: SelectChangeEvent<string>) => {
    setAppSettings({
      ...appSettings,
      defaultCurrency: event.target.value
    });
  };
  
  const handleValuationModeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    if (value === 'usd' || value === 'coin') {
      setAppSettings({
        ...appSettings,
        defaultValuationMode: value
      });
    }
  };
  
  const handleDecimalPrecisionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      setAppSettings({
        ...appSettings,
        decimalPrecision: value
      });
    }
  };
  
  // Handle portfolio settings changes
  const handlePortfolioNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExtendedSettings({
      ...extendedSettings,
      name: event.target.value
    });
  };
  
  const handlePortfolioDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setExtendedSettings({
      ...extendedSettings,
      description: event.target.value
    });
  };
  
  const handleSavePortfolioSettings = () => {
    // Save core portfolio settings to context
    setPortfolioSettings({
      startDate: extendedSettings.startDate,
      initialBalance: extendedSettings.initialBalance
    });
    
    // Save extended fields to localStorage
    localStorage.setItem('portfolioName', extendedSettings.name || '');
    localStorage.setItem('portfolioDescription', extendedSettings.description || '');
    
    // Also save the core settings to localStorage for persistence
    localStorage.setItem('portfolioSettings', JSON.stringify({
      startDate: extendedSettings.startDate,
      initialBalance: extendedSettings.initialBalance
    }));
  };
  
  // Handle manual import
  const handleManualImport = async () => {
    try {
      // Request permission to access the save_data directory
      const permissionGranted = await requestDirectoryPermission();
      
      if (permissionGranted) {
        // Save that we've requested permission
        localStorage.setItem('permissionRequested', 'true');
        
        // Import the most recent backup
        const importResult = await importMostRecentBackup();
        
        if (importResult.success) {
          // Update the trades in context
          importTrades(importResult.trades);
          
          // Update portfolio settings if available
          if (importResult.portfolioSettings) {
            setPortfolioSettings(importResult.portfolioSettings);
          }
          
          // Update portfolio value if available
          if (importResult.portfolioValue) {
            setPortfolioValue(importResult.portfolioValue);
          }
          
          // Update app settings if available
          if (importResult.appSettings) {
            setAppSettings(importResult.appSettings);
          }
          
          // Show success message
          setSnackbarMessage(`Import successful: ${importResult.message}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          // Show error message
          setSnackbarMessage(`Import failed: ${importResult.message}`);
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
        }
      } else {
        // Show error message
        setSnackbarMessage('Permission denied. Cannot import backup files.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error importing backup:', error);
      setSnackbarMessage(`Error importing backup: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* General Application Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Application Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={appSettings.darkMode}
                  onChange={handleDarkModeToggle}
                  color="primary"
                />
              }
              label="Dark Mode"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="default-currency-label">Default Currency</InputLabel>
              <Select
                labelId="default-currency-label"
                value={appSettings.defaultCurrency}
                onChange={handleCurrencyChange}
                label="Default Currency"
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="JPY">JPY</MenuItem>
                <MenuItem value="AUD">AUD</MenuItem>
                <MenuItem value="CAD">CAD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="default-valuation-mode-label">Default Valuation Mode</InputLabel>
              <Select
                labelId="default-valuation-mode-label"
                value={appSettings.defaultValuationMode}
                onChange={handleValuationModeChange}
                label="Default Valuation Mode"
              >
                <MenuItem value="usd">USD Value</MenuItem>
                <MenuItem value="coin">Coin Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Decimal Precision"
              type="number"
              value={appSettings.decimalPrecision}
              onChange={handleDecimalPrecisionChange}
              InputProps={{
                inputProps: { min: 0, max: 10 }
              }}
              helperText="Number of decimal places to display for crypto amounts"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Portfolio Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Portfolio Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Portfolio Name"
              value={extendedSettings.name || ''}
              onChange={handlePortfolioNameChange}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Description"
              value={extendedSettings.description || ''}
              onChange={handlePortfolioDescriptionChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Initial Balance"
              type="number"
              value={extendedSettings.initialBalance}
              onChange={(e) => setExtendedSettings({
                ...extendedSettings,
                initialBalance: parseFloat(e.target.value) || 0
              })}
              InputProps={{
                inputProps: { min: 0, step: 100 }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={extendedSettings.startDate}
              onChange={(e) => setExtendedSettings({
                ...extendedSettings,
                startDate: e.target.value
              })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSavePortfolioSettings}
            >
              Save Portfolio Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Backup & Auto-Save Settings */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h5">
          Backup & Auto-Save
        </Typography>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={handleManualImport}
        >
          Import Backup File
        </Button>
      </Box>
      
      <AutoSaveSettings />
      
      {/* Additional settings sections can be added here */}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings; 