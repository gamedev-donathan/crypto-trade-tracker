import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import { useTrades, usePortfolio } from '../context/TradeContext';
import { exportTradesAsZip } from '../utils/zipUtils';
import { Info as InfoIcon } from '@mui/icons-material';

// Auto-save settings interface
interface AutoSaveSettings {
  enabled: boolean;
  interval: number; // in minutes
  filePath: string;
  lastSaveTime?: string;
}

const AutoSaveSettings: React.FC = () => {
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
          filePath: '',
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
  }, [settings.enabled, settings.interval, settings.filePath]);
  
  // Handle auto-save
  const handleAutoSave = async () => {
    if (!settings.enabled || !settings.filePath) {
      return;
    }
    
    try {
      // Generate filename with date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `crypto-trades-backup-${dateStr}-${timeStr}.zip`;
      
      // Create the ZIP file
      const blob = await createZipBlob();
      
      // Save the file using the File System Access API if available
      if ('showSaveFilePicker' in window) {
        try {
          // @ts-ignore - TypeScript doesn't have types for the File System Access API yet
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'ZIP Files',
              accept: {'application/zip': ['.zip']},
            }],
          });
          
          // Create a writable stream
          const writable = await fileHandle.createWritable();
          
          // Write the blob to the file
          await writable.write(blob);
          
          // Close the file
          await writable.close();
          
          // Update last save time
          setSettings({
            ...settings,
            lastSaveTime: now.toISOString()
          });
          
          // Show success message
          setSnackbarMessage(`Auto-save successful: ${fileHandle.name}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (error) {
          // User might have cancelled the save dialog
          console.error('Error saving file:', error);
          if (error instanceof Error && error.name !== 'AbortError') {
            setSnackbarMessage(`Auto-save failed: ${error.message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }
      } else {
        // Fallback for browsers that don't support the File System Access API
        // Just trigger a download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update last save time
        setSettings({
          ...settings,
          lastSaveTime: now.toISOString()
        });
        
        // Show success message
        setSnackbarMessage(`Auto-save successful: ${filename} (downloaded)`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSnackbarMessage(`Auto-save failed: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Create a ZIP blob
  const createZipBlob = async (): Promise<Blob> => {
    // This is a workaround since we can't directly get the blob from exportTradesAsZip
    // We'll create a mock implementation that returns the blob instead of downloading it
    
    const jszip = await import('jszip');
    const JSZip = jszip.default;
    
    const zip = new JSZip();
    
    // Create a folder for the trade data
    const dataFolder = zip.folder('data');
    
    // Create a folder for screenshots
    const screenshotsFolder = zip.folder('screenshots');
    
    if (!dataFolder || !screenshotsFolder) {
      throw new Error('Failed to create folders in ZIP file');
    }
    
    // Add trade data as JSON, but first clean up the screenshot data to only include references
    const tradesWithScreenshotRefs = trades.map(trade => {
      const { screenshots, ...tradeData } = trade;
      
      // If the trade has screenshots, replace the data with references
      if (screenshots && screenshots.length > 0) {
        return {
          ...tradeData,
          screenshots: screenshots.map(screenshot => ({
            id: screenshot.id,
            timestamp: screenshot.timestamp,
            label: screenshot.label,
            type: screenshot.type,
            filename: `${screenshot.id}.png` // Reference to the screenshot file
          }))
        };
      }
      
      return tradeData;
    });
    
    // Create the export data object with trades and portfolio information
    const exportData = {
      trades: tradesWithScreenshotRefs,
      portfolioSettings,
      portfolioValue,
      appSettings,
      exportDate: new Date().toISOString()
    };
    
    // Add the export data to the ZIP file
    dataFolder.file('trades.json', JSON.stringify(exportData, null, 2));
    
    // Add screenshots to the ZIP file
    for (const trade of trades) {
      if (trade.screenshots && trade.screenshots.length > 0) {
        for (const screenshot of trade.screenshots) {
          // Extract the base64 data (remove the data:image/png;base64, prefix)
          const base64Data = screenshot.data.split(',')[1];
          
          // Add the screenshot to the ZIP file
          screenshotsFolder.file(`${screenshot.id}.png`, base64Data, { base64: true });
        }
      }
    }
    
    // Generate the ZIP file as a blob
    return await zip.generateAsync({ type: 'blob' });
  };
  
  // Handle manual save
  const handleManualSave = () => {
    handleAutoSave();
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
  
  const handleFilePathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      filePath: event.target.value
    });
  };
  
  // Handle directory picker
  const handleDirectoryPicker = async () => {
    try {
      // @ts-ignore - TypeScript doesn't have types for the File System Access API yet
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        setSettings({
          ...settings,
          filePath: dirHandle.name
        });
      } else {
        setSnackbarMessage('Directory picker is not supported in this browser');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      // User might have cancelled the directory picker
      console.error('Error picking directory:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        setSnackbarMessage(`Error picking directory: ${error.message}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
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
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label="Save Directory"
              value={settings.filePath}
              onChange={handleFilePathChange}
              disabled={!settings.enabled}
              placeholder="Click 'Choose Directory' to select"
              helperText={
                'showDirectoryPicker' in window 
                  ? "Select a directory where backups will be saved" 
                  : "Your browser doesn't support directory selection. Files will be downloaded instead."
              }
            />
            <Button 
              variant="outlined" 
              onClick={handleDirectoryPicker}
              disabled={!settings.enabled || !('showDirectoryPicker' in window)}
              sx={{ mt: 1, height: 40 }}
            >
              Choose Directory
            </Button>
          </Box>
        </Grid>
        
        {settings.lastSaveTime && (
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              Last auto-save: {new Date(settings.lastSaveTime).toLocaleString()}
            </Typography>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleManualSave}
            disabled={!settings.enabled}
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