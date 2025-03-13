import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard';
import TradeForm from './components/TradeForm';
import TradeList from './components/TradeList';
import Settings from './components/Settings';
import Layout from './components/Layout';
import { TradeProvider, useTrades } from './context/TradeContext';
import { importMostRecentBackup, requestDirectoryPermission } from './utils/autoImportUtils';
import { Snackbar, Alert } from '@mui/material';
import PermissionRequest from './components/PermissionRequest';

// Theme component that uses the context
const ThemedApp: React.FC = () => {
  const { appSettings, importTrades, setPortfolioSettings, setPortfolioValue, setAppSettings } = useTrades();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  
  // Check if we should show the permission dialog
  useEffect(() => {
    const checkPermissionStatus = () => {
      // Check if we've shown the dialog before
      const permissionRequested = localStorage.getItem('permissionRequested');
      
      if (!permissionRequested && 'showDirectoryPicker' in window) {
        // Show the permission dialog
        setPermissionDialogOpen(true);
      }
    };
    
    checkPermissionStatus();
  }, []);
  
  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      const permissionGranted = await requestDirectoryPermission();
      
      if (permissionGranted) {
        // Save that we've requested permission
        localStorage.setItem('permissionRequested', 'true');
        
        // Enable auto-save with default settings
        const autoSaveSettings = {
          enabled: true,
          interval: 60, // Default to 60 minutes
          filePath: 'save_data',
          lastSaveTime: new Date().toISOString()
        };
        
        localStorage.setItem('autoSaveSettings', JSON.stringify(autoSaveSettings));
        
        // Show success message
        setSnackbarMessage('Permission granted. Auto-save has been enabled.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Close the dialog
        setPermissionDialogOpen(false);
        
        // Try to import the most recent backup
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
          setSnackbarMessage(`Auto-import successful: ${importResult.message}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        }
      } else {
        // Show error message
        setSnackbarMessage('Permission denied. Auto-save will not be enabled.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        
        // Save that we've requested permission
        localStorage.setItem('permissionRequested', 'false');
        
        // Close the dialog
        setPermissionDialogOpen(false);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setSnackbarMessage(`Error requesting permission: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      
      // Close the dialog
      setPermissionDialogOpen(false);
    }
  };
  
  // Handle closing the permission dialog
  const handleClosePermissionDialog = () => {
    // Save that we've requested permission
    localStorage.setItem('permissionRequested', 'false');
    
    // Close the dialog
    setPermissionDialogOpen(false);
    
    // Show info message
    setSnackbarMessage('You can enable auto-save later in the Settings page.');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
  };
  
  // Import most recent backup on startup
  useEffect(() => {
    const autoImportOnStartup = async () => {
      try {
        // Always try to import the most recent backup on startup
        // regardless of auto-save settings
        const permissionRequested = localStorage.getItem('permissionRequested');
        
        if (permissionRequested === 'true') {
          // Check if we have any trades already
          const existingTradesJson = localStorage.getItem('trades');
          const existingTrades = existingTradesJson ? JSON.parse(existingTradesJson) : [];
          
          // Import the most recent backup
          const importResult = await importMostRecentBackup();
          
          if (importResult.success) {
            // Only import if we have trades in the backup
            if (importResult.trades && importResult.trades.length > 0) {
              // If we already have trades, ask before overwriting
              if (existingTrades.length > 0) {
                // Only overwrite if the backup has more trades
                if (importResult.trades.length > existingTrades.length) {
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
                  setSnackbarMessage(`Auto-import successful: ${importResult.message} (${importResult.trades.length} trades)`);
                  setSnackbarSeverity('success');
                  setSnackbarOpen(true);
                } else {
                  // Show info message
                  setSnackbarMessage(`Auto-import skipped: Current data has more trades (${existingTrades.length}) than backup (${importResult.trades.length})`);
                  setSnackbarSeverity('info');
                  setSnackbarOpen(true);
                }
              } else {
                // No existing trades, just import
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
                setSnackbarMessage(`Auto-import successful: ${importResult.message} (${importResult.trades.length} trades)`);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
              }
            } else {
              // No trades in the backup
              setSnackbarMessage(`Auto-import skipped: No trades found in backup`);
              setSnackbarSeverity('info');
              setSnackbarOpen(true);
            }
          } else if (importResult.message !== 'No backup files found in the save_data directory' && 
                     importResult.message !== 'Directory selection was cancelled') {
            // Show error message (but not if there are simply no backups yet or if user cancelled)
            setSnackbarMessage(`Auto-import failed: ${importResult.message}`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
          }
        }
      } catch (error) {
        console.error('Error auto-importing on startup:', error);
        setSnackbarMessage(`Error auto-importing on startup: ${error instanceof Error ? error.message : String(error)}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    };
    
    // Only run auto-import if permission dialog is not open
    if (!permissionDialogOpen) {
      autoImportOnStartup();
    }
  }, [importTrades, setPortfolioSettings, setPortfolioValue, setAppSettings, permissionDialogOpen]);
  
  // Create theme based on dark mode setting
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: appSettings.darkMode ? 'dark' : 'light',
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
        background: {
          default: appSettings.darkMode ? '#121212' : '#f5f5f5',
          paper: appSettings.darkMode ? '#1e1e1e' : '#ffffff',
        },
      },
    }),
  [appSettings.darkMode]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-trade" element={<TradeForm />} />
            <Route path="/trades" element={<TradeList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
      
      {/* Permission Request Dialog */}
      <PermissionRequest
        open={permissionDialogOpen}
        onClose={handleClosePermissionDialog}
        onRequestPermission={handleRequestPermission}
      />
      
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
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <TradeProvider>
      <ThemedApp />
    </TradeProvider>
  );
};

export default App;
