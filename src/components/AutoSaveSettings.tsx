import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Grid,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import { useTrades, usePortfolio } from '../context/TradeContext';
import { createZipBlob } from '../utils/zipUtils';
import { Info as InfoIcon } from '@mui/icons-material';

// Auto-save settings interface
interface AutoSaveSettings {
  enabled: boolean;
  interval: number; // in minutes
  lastSaveTime?: string;
}

const AutoSaveSettings: React.FC = () => {
  // Get data from context - must be at the component level, not inside handlers
  const { trades, portfolioSettings, appSettings } = useTrades();
  const { portfolioValue } = usePortfolio();
  
  // Load settings from localStorage
  const [settings, setSettings] = useState<AutoSaveSettings>(() => {
    const savedSettings = localStorage.getItem('autoSaveSettings');
    return savedSettings 
      ? JSON.parse(savedSettings) 
      : {
          enabled: false,
          interval: 60, // Default to 60 minutes
          lastSaveTime: undefined
        };
  });
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('autoSaveSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Create a memoized function to create the ZIP blob
  const createZipBlobWithData = useCallback(async () => {
    return await createZipBlob(trades, portfolioSettings, portfolioValue, appSettings);
  }, [trades, portfolioSettings, portfolioValue, appSettings]);
  
  // Set up auto-save timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (settings.enabled && settings.interval > 0) {
      // Convert minutes to milliseconds
      const intervalMs = settings.interval * 60 * 1000;
      
      timer = setInterval(() => {
        handleAutoSave();
      }, intervalMs);
    }
    
    // Clean up timer on unmount or when settings change
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [settings.enabled, settings.interval, createZipBlobWithData]);
  
  // Simple function to download a file
  const downloadFile = async (blob: Blob, filename: string): Promise<void> => {
    // Create a temporary link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    // Add to document, click, and remove
    document.body.appendChild(a);
    a.click();
    
    // Small timeout to ensure the download starts
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle auto-save
  const handleAutoSave = async () => {
    if (!settings.enabled) {
      return;
    }
    
    try {
      // Generate filename with date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `crypto-trades-backup-${dateStr}-${timeStr}.zip`;
      
      // Create the ZIP file using the memoized function
      const blob = await createZipBlobWithData();
      
      // Just download the file directly
      await downloadFile(blob, filename);
      
      // Update last save time
      setSettings({
        ...settings,
        lastSaveTime: now.toISOString()
      });
      
      // Show success message
      setSnackbarMessage(`Auto-save successful: ${filename}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSnackbarMessage(`Auto-save failed: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle manual save - same as auto-save but can be triggered manually
  const handleManualSave = async () => {
    try {
      // Generate filename with date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `crypto-trades-backup-${dateStr}-${timeStr}.zip`;
      
      // Create the ZIP file using the memoized function
      const blob = await createZipBlobWithData();
      
      // Just download the file directly
      await downloadFile(blob, filename);
      
      // Update last save time
      setSettings({
        ...settings,
        lastSaveTime: now.toISOString()
      });
      
      // Show success message
      setSnackbarMessage(`Manual save successful: ${filename}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Manual save failed:', error);
      setSnackbarMessage(`Manual save failed: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Handle settings changes
  const handleToggleEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      enabled: event.target.checked
    });
  };
  
  const handleIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setSettings({
        ...settings,
        interval: value
      });
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Auto-Save Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={handleToggleEnabled}
                color="primary"
              />
            }
            label="Enable Auto-Save"
          />
          <Tooltip title="Automatically saves your trade data at regular intervals">
            <InfoIcon fontSize="small" color="action" sx={{ ml: 1, verticalAlign: 'middle' }} />
          </Tooltip>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Auto-Save Interval (minutes)"
            type="number"
            value={settings.interval}
            onChange={handleIntervalChange}
            disabled={!settings.enabled}
            InputProps={{
              inputProps: { min: 1 }
            }}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Files will be automatically downloaded to your default download location with timestamps.
          </Typography>
        </Grid>
        
        {settings.lastSaveTime && (
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Last save: {new Date(settings.lastSaveTime).toLocaleString()}
            </Typography>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleManualSave}
          >
            Save Now
          </Button>
        </Grid>
      </Grid>
      
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
    </Paper>
  );
};

export default AutoSaveSettings; 