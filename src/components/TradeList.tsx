import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Grid,
  Card,
  CardMedia,
  CardContent,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useTrades } from '../context/TradeContext';
import { Trade, PartialExit, Screenshot } from '../types';
import ScreenshotUploader from './ScreenshotUploader';
import { exportTradesAsZip } from '../utils/zipUtils';
import JSZip from 'jszip';
import { importTradesFromZip } from '../utils/zipUtils';

// Add a helper function to format numbers to avoid scientific notation
const formatFullDecimal = (num: number): string => {
  if (num === 0) return '0';

  // Convert to string and check if it uses scientific notation
  const numStr = num.toString();
  if (!numStr.includes('e')) return numStr;

  // Handle scientific notation
  return Number(num).toFixed(20).replace(/\.?0+$/, '');
};

const TradeList: React.FC = () => {
  const { 
    trades, 
    updateStopLoss, 
    closeTrade, 
    closePartialTrade, 
    setTrailingStop, 
    deleteTrade, 
    importTrades, 
    updateTrade, 
    portfolioValue, 
    setPortfolioValue,
    portfolioSettings,
    setPortfolioSettings,
    appSettings,
    setAppSettings
  } = useTrades();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openStopLossDialog, setOpenStopLossDialog] = useState(false);
  const [openCloseTradeDialog, setOpenCloseTradeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [newStopLoss, setNewStopLoss] = useState('');
  const [stopLossFees, setStopLossFees] = useState('0.1'); // Default trading fee of 0.1%
  const [stopLossFeesType, setStopLossFeesType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  const [exitPrice, setExitPrice] = useState('');
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitPriceOption, setExitPriceOption] = useState<'custom' | 'entry' | 'stopLoss'>('custom');
  const [exitFees, setExitFees] = useState('0.1'); // Default trading fee of 0.1%
  const [exitFeesType, setExitFeesType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  const [sortField, setSortField] = useState<keyof Trade>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  // Add state for quantity display mode
  const [quantityDisplayMode, setQuantityDisplayMode] = useState<'native' | 'coins'>('native');

  // Export/Import state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [importAnchorEl, setImportAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for expanded trade rows and preview
  const [expandedTrades, setExpandedTrades] = useState<Record<string, boolean>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // Add state for edit trade dialog
  const [openEditTradeDialog, setOpenEditTradeDialog] = useState(false);
  const [editedTrade, setEditedTrade] = useState<Trade | null>(null);

  // Add state for trailing stop dialog
  const [openTrailingStopDialog, setOpenTrailingStopDialog] = useState(false);
  const [trailingStopAmount, setTrailingStopAmount] = useState('');
  const [trailingStopType, setTrailingStopType] = useState<'percentage' | 'fixed'>('percentage');

  // Add state for partial close dialog
  const [openPartialCloseDialog, setOpenPartialCloseDialog] = useState(false);
  const [partialCloseAmount, setPartialCloseAmount] = useState('');
  const [partialClosePrice, setPartialClosePrice] = useState('');
  const [partialCloseDate, setPartialCloseDate] = useState(new Date().toISOString().split('T')[0]);
  const [partialCloseFees, setPartialCloseFees] = useState('0.1');
  const [partialCloseFeesType, setPartialCloseFeesType] = useState<'percentage' | 'fixed'>('percentage');
  const [partialExitNotes, setPartialExitNotes] = useState('');

  // Add state for view mode
  const [viewMode, setViewMode] = useState<'active' | 'closed' | 'all'>('active');

  // Add state for import type
  const [importType, setImportType] = useState<'json' | 'csv' | 'zip'>('json');

  // Add state for notes and lessons editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingLessons, setIsEditingLessons] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedLessons, setEditedLessons] = useState('');

  // Add state for screenshots
  const [exitScreenshots, setExitScreenshots] = useState<Screenshot[]>([]);

  // Add state for partial exit
  const [partialExitQuantity, setPartialExitQuantity] = useState('');
  const [partialExitFees, setPartialExitFees] = useState('0.1');
  const [partialExitFeesType, setPartialExitFeesType] = useState<'percentage' | 'fixed'>('percentage');

  // Sort trades
  const sortedTrades = [...trades].sort((a, b) => {
    if (sortField === 'entryDate' || sortField === 'exitDate') {
      const dateA = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
      const dateB = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (
      sortField === 'entryPrice' ||
      sortField === 'exitPrice' ||
      sortField === 'quantity' ||
      sortField === 'stopLoss'
    ) {
      const numA = a[sortField] || 0;
      const numB = b[sortField] || 0;
      return sortDirection === 'asc' ? (numA as number) - (numB as number) : (numB as number) - (numA as number);
    } else {
      const strA = String(a[sortField] || '').toLowerCase();
      const strB = String(b[sortField] || '').toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
  });

  // Filter active and closed trades
  const activeTrades = sortedTrades.filter(trade => trade.isActive);
  const closedTrades = sortedTrades.filter(trade => !trade.isActive);

  // Functions for handling dialogs and actions
  const handleOpenStopLossDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setNewStopLoss(trade.stopLoss ? trade.stopLoss.toString() : '');
    setOpenStopLossDialog(true);
  };

  const handleCloseStopLossDialog = () => {
    setOpenStopLossDialog(false);
    setSelectedTrade(null);
  };

  const handleUpdateStopLoss = () => {
    if (selectedTrade && newStopLoss) {
      updateStopLoss(
        selectedTrade.id,
        parseFloat(newStopLoss)
      );
      handleCloseStopLossDialog();
    }
  };

  const handleOpenCloseTradeDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setExitPrice('');
    setExitDate(new Date().toISOString().split('T')[0]);
    setExitPriceOption('custom');
    setOpenCloseTradeDialog(true);
  };

  const handleCloseCloseTradeDialog = () => {
    setOpenCloseTradeDialog(false);
    setSelectedTrade(null);
  };

  const handleCloseTrade = () => {
    if (selectedTrade && exitPrice) {
      closeTrade(
        selectedTrade.id,
        parseFloat(exitPrice),
        exitDate,
        parseFloat(exitFees) || undefined,
        exitFeesType,
        exitScreenshots.length > 0 ? exitScreenshots : undefined
      );
      handleCloseCloseTradeDialog();
    }
  };

  const handleOpenDeleteDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTrade(null);
  };

  const handleDeleteTrade = () => {
    if (selectedTrade) {
      deleteTrade(selectedTrade.id);
      handleCloseDeleteDialog();
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: keyof Trade) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  // Handle import menu
  const handleImportClick = (event: React.MouseEvent<HTMLElement>) => {
    setImportAnchorEl(event.currentTarget);
  };

  const handleImportClose = () => {
    setImportAnchorEl(null);
  };

  // Handle file input click
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      if (importType === 'json') {
        handleImportJSON();
      } else if (importType === 'csv') {
        handleImportCSV();
      } else if (importType === 'zip') {
        handleImportZIP();
      }
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    try {
      const jsonData = JSON.stringify(trades, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-trades-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbarMessage('Trades exported successfully to JSON');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      setSnackbarMessage('Error exporting trades to JSON');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    handleExportClose();
  };

  // Export to CSV
  const handleExportCSV = () => {
    try {
      // Define CSV headers
      const headers = [
        'id',
        'cryptocurrency',
        'coinId',
        'name',
        'entryPrice',
        'exitPrice',
        'quantity',
        'quantityType',
        'stopLoss',
        'entryDate',
        'exitDate',
        'notes',
        'lessonsLearned',
        'isActive',
        'fees',
        'feesType'
      ].join(',');

      // Convert trades to CSV rows
      const rows = trades.map(trade => {
        return [
          trade.id,
          `"${trade.cryptocurrency}"`, // Wrap in quotes to handle commas in names
          trade.coinId,
          `"${trade.name || ''}"`,
          trade.entryPrice,
          trade.exitPrice || '',
          trade.quantity,
          trade.quantityType,
          trade.stopLoss,
          trade.entryDate,
          trade.exitDate || '',
          `"${trade.notes || ''}"`, // Wrap in quotes to handle commas in notes
          `"${trade.lessonsLearned || ''}"`,
          trade.isActive,
          trade.fees || 0.1,
          trade.feesType || 'percentage'
        ].join(',');
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbarMessage('Trades exported successfully to CSV');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setSnackbarMessage('Error exporting trades to CSV');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    handleExportClose();
  };

  // Export partial exits to CSV
  const handleExportPartialExitsCSV = () => {
    try {
      // Define CSV headers for partial exits
      const headers = [
        'tradeId',
        'cryptocurrency',
        'partialExitId',
        'exitDate',
        'exitPrice',
        'exitQuantity',
        'notes',
        'fees',
        'feesType'
      ].join(',');

      // Collect all partial exits from all trades
      const partialExitRows: string[] = [];

      trades.forEach(trade => {
        if (trade.partialExits && trade.partialExits.length > 0) {
          trade.partialExits.forEach(exit => {
            partialExitRows.push([
              trade.id,
              `"${trade.cryptocurrency}"`,
              exit.id,
              exit.exitDate,
              exit.exitPrice,
              exit.exitQuantity,
              `"${exit.notes || ''}"`,
              exit.fees || 0.1,
              exit.feesType || 'percentage'
            ].join(','));
          });
        }
      });

      if (partialExitRows.length === 0) {
        setSnackbarMessage('No partial exits to export');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
        handleExportClose();
        return;
      }

      // Combine headers and rows
      const csvContent = [headers, ...partialExitRows].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-partial-exits-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbarMessage('Partial exits exported successfully to CSV');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting partial exits to CSV:', error);
      setSnackbarMessage('Error exporting partial exits to CSV');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }

    handleExportClose();
  };

  // Import from JSON
  const handleImportJSON = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'application/json';
      fileInputRef.current.click();
    }
    handleImportClose();
  };

  // Import from CSV
  const handleImportCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.csv';
      fileInputRef.current.click();
    }
    handleImportClose();
  };

  // Import from ZIP
  const handleImportZIP = async (): Promise<void> => {
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      const file = fileInputRef.current.files[0];

      try {
        // Use the importTradesFromZip utility
        const { 
          trades: importedTrades, 
          portfolioSettings: importedSettings, 
          portfolioValue: importedPortfolioValue,
          appSettings: importedAppSettings 
        } = await importTradesFromZip(file);

        // Update the trades in context
        importTrades(importedTrades);

        // Update portfolio settings if available
        if (importedSettings) {
          setPortfolioSettings(importedSettings);
        }

        // Update portfolio value if available
        if (importedPortfolioValue) {
          setPortfolioValue(importedPortfolioValue);
        }
        
        // Update app settings if available
        if (importedAppSettings) {
          setAppSettings(importedAppSettings);
        }

        setSnackbarMessage(`Successfully imported ${importedTrades.length} trades with screenshots from ZIP archive`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        // Close the import menu
        handleImportClose();
      } catch (error) {
        console.error('Error importing ZIP file:', error);
        setSnackbarMessage('Error importing ZIP file: ' + (error instanceof Error ? error.message : String(error)));
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  // Handle toggle expand for trade details
  const handleToggleExpand = (tradeId: string) => {
    setExpandedTrades(prev => ({
      ...prev,
      [tradeId]: !prev[tradeId]
    }));
  };

  // Handle opening the edit trade dialog
  const handleOpenEditTradeDialog = (trade: Trade) => {
    setEditedTrade({ ...trade });
    setOpenEditTradeDialog(true);
  };

  // Handle closing the edit trade dialog
  const handleCloseEditTradeDialog = () => {
    setOpenEditTradeDialog(false);
    setEditedTrade(null);
  };

  // Handle opening the trailing stop dialog
  const handleOpenTrailingStopDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setTrailingStopAmount('');
    setTrailingStopType('percentage');
    setOpenTrailingStopDialog(true);
  };

  // Handle opening the partial close dialog
  const handleOpenPartialCloseDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setPartialCloseAmount('');
    setPartialClosePrice('');
    setPartialCloseDate(new Date().toISOString().split('T')[0]);
    setPartialCloseFees('0.1');
    setPartialCloseFeesType('percentage');
    setPartialExitNotes('');
    setOpenPartialCloseDialog(true);
  };

  // Handle partial close trade
  const handlePartialCloseTrade = () => {
    if (selectedTrade && partialClosePrice && partialCloseAmount) {
      const partialPriceNum = parseFloat(partialClosePrice);
      const partialQuantityNum = parseFloat(partialCloseAmount);
      const partialFeesNum = parseFloat(partialCloseFees);

      if (!isNaN(partialPriceNum) && !isNaN(partialQuantityNum) && !isNaN(partialFeesNum)) {
        // Close partial trade
        closePartialTrade(
          selectedTrade.id,
          partialPriceNum,
          partialQuantityNum,
          partialExitNotes
        );

        // Update the fees
        updateTrade(selectedTrade.id, {
          fees: partialFeesNum,
          feesType: partialCloseFeesType
        });

        // Close dialog
        setOpenPartialCloseDialog(false);
        setSelectedTrade(null);
      }
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle notes editing
  const handleStartEditingNotes = (trade: Trade) => {
    setEditedNotes(trade.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = (tradeId: string) => {
    updateTrade(tradeId, { notes: editedNotes });
    setIsEditingNotes(false);
  };

  const handleCancelEditingNotes = () => {
    setIsEditingNotes(false);
  };

  // Handle lessons learned editing
  const handleStartEditingLessons = (trade: Trade) => {
    setEditedLessons(trade.lessonsLearned || '');
    setIsEditingLessons(true);
  };

  const handleSaveLessons = (tradeId: string) => {
    updateTrade(tradeId, { lessonsLearned: editedLessons });
    setIsEditingLessons(false);
  };

  const handleCancelEditingLessons = () => {
    setIsEditingLessons(false);
  };

  // Handle export as ZIP
  const handleExportZIP = async () => {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `crypto-trades-backup-${dateStr}-${timeStr}.zip`;
      
      // Check if auto-save settings exist
      const savedAutoSaveSettings = localStorage.getItem('autoSaveSettings');
      const autoSaveSettings = savedAutoSaveSettings ? JSON.parse(savedAutoSaveSettings) : null;
      
      // Create a blob for the ZIP file
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
        exportDate: now.toISOString()
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
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Save the file using the File System Access API if available and if auto-save is enabled
      if (autoSaveSettings?.enabled && autoSaveSettings?.filePath && 'showSaveFilePicker' in window) {
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
          
          // Update last save time in auto-save settings
          if (autoSaveSettings) {
            autoSaveSettings.lastSaveTime = now.toISOString();
            localStorage.setItem('autoSaveSettings', JSON.stringify(autoSaveSettings));
          }
          
          setSnackbarMessage(`Successfully exported trades to ${fileHandle.name}`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } catch (error) {
          // User might have cancelled the save dialog
          console.error('Error saving file:', error);
          if (error instanceof Error && error.name !== 'AbortError') {
            setSnackbarMessage(`Export failed: ${error.message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }
        }
      } else {
        // Fallback for browsers that don't support the File System Access API
        // or if auto-save is not enabled
        // Just trigger a download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update last save time in auto-save settings if enabled
        if (autoSaveSettings?.enabled) {
          autoSaveSettings.lastSaveTime = now.toISOString();
          localStorage.setItem('autoSaveSettings', JSON.stringify(autoSaveSettings));
        }
        
        setSnackbarMessage('Successfully exported trades with screenshots as ZIP');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }

      // Close the export menu
      handleExportClose();
    } catch (error) {
      console.error('Error exporting ZIP file:', error);
      setSnackbarMessage('Error exporting ZIP file: ' + (error instanceof Error ? error.message : String(error)));
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate profit/loss
  const calculateProfitLoss = (trade: Trade) => {
    if (!trade.exitPrice) return null;

    const isShort = trade.cryptocurrency.toLowerCase().includes('short');

    // Calculate actual quantity in coins if input is in dollars
    const actualQuantity = trade.quantityType === 'dollars'
      ? trade.quantity / trade.entryPrice
      : trade.quantity;

    // Calculate raw profit/loss
    const rawProfitLoss = (trade.exitPrice - trade.entryPrice) * actualQuantity * (isShort ? -1 : 1);

    // Calculate fees
    let feeAmount = 0;
    if (trade.fees) {
      if (trade.feesType === 'percentage') {
        // For percentage fees, calculate based on position size
        const positionSizeDollars = trade.quantityType === 'dollars'
          ? trade.quantity
          : trade.quantity * trade.entryPrice;
        feeAmount = (positionSizeDollars * trade.fees) / 100;
      } else {
        // For fixed fees, use the fixed amount
        feeAmount = trade.fees;
      }
    }

    // Subtract fees from profit
    const profitLoss = rawProfitLoss - feeAmount;
    const profitLossPercentage = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (isShort ? -1 : 1);

    return {
      value: profitLoss,
      percentage: profitLossPercentage
    };
  };

  // Format quantity with type
  const formatQuantity = (trade: Trade) => {
    if (quantityDisplayMode === 'native') {
      // Display in the native format (dollars or coins as stored)
      if (trade.quantityType === 'coins') {
        return `${formatFullDecimal(trade.quantity)} coins`;
      } else {
        return `$${formatFullDecimal(trade.quantity)}`;
      }
    } else {
      // Always display in coins
      if (trade.quantityType === 'coins') {
        return `${formatFullDecimal(trade.quantity)} coins`;
      } else {
        // Convert dollars to coins using entry price
        const coinAmount = trade.quantity / trade.entryPrice;
        return `${formatFullDecimal(coinAmount)} coins`;
      }
    }
  };

  // Calculate profit/loss for partial exits
  const calculatePartialExitProfitLoss = (trade: Trade, exit: PartialExit) => {
    const isShort = trade.cryptocurrency.toLowerCase().includes('short');

    // Calculate raw profit/loss
    const rawProfitLoss = (exit.exitPrice - trade.entryPrice) * exit.exitQuantity * (isShort ? -1 : 1);

    // Calculate fees
    let feeAmount = 0;
    if (exit.fees) {
      if (exit.feesType === 'percentage') {
        // For percentage fees, calculate based on position size
        const positionSizeDollars = exit.exitQuantity * trade.entryPrice;
        feeAmount = (positionSizeDollars * exit.fees) / 100;
      } else {
        // For fixed fees, use the fixed amount
        feeAmount = exit.fees;
      }
    }

    // Subtract fees from profit
    const profitLoss = rawProfitLoss - feeAmount;
    const profitLossPercentage = ((exit.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (isShort ? -1 : 1);

    return {
      value: profitLoss,
      percentage: profitLossPercentage
    };
  };

  // Handle exit price option change
  const handleExitPriceOptionChange = (option: 'custom' | 'entry' | 'stopLoss') => {
    setExitPriceOption(option);

    if (selectedTrade) {
      if (option === 'entry') {
        setExitPrice(selectedTrade.entryPrice.toString());
      } else if (option === 'stopLoss' && selectedTrade.stopLoss) {
        setExitPrice(selectedTrade.stopLoss.toString());
      }
    }
  };

  // Add R-multiple exit price function for the close trade dialog
  const handleSetRMultipleExit = (rMultiple: number) => {
    if (selectedTrade && selectedTrade.stopLoss) {
      const isShort = selectedTrade.cryptocurrency.toLowerCase().includes('short');
      const priceDifference = Math.abs(selectedTrade.entryPrice - selectedTrade.stopLoss);

      // Calculate exit price based on R-multiple
      let newExitPrice;
      if (isShort) {
        // For shorts, profit is when price goes down
        newExitPrice = selectedTrade.entryPrice - (priceDifference * rMultiple);
      } else {
        // For longs, profit is when price goes up
        newExitPrice = selectedTrade.entryPrice + (priceDifference * rMultiple);
      }

      setExitPrice(newExitPrice.toString());
      setExitPriceOption('custom');
    }
  };

  // Handle close partial close dialog
  const handleClosePartialCloseDialog = () => {
    setOpenPartialCloseDialog(false);
    setSelectedTrade(null);
  };

  // Add functions for preset partial close amounts
  const handleSetPartialPosition = (percentage: number) => {
    if (selectedTrade) {
      const availableQuantity = selectedTrade.remainingQuantity || selectedTrade.quantity;
      setPartialExitQuantity((availableQuantity * (percentage / 100)).toString());
    }
  };

  // Handle trailing stop dialog
  const handleCloseTrailingStopDialog = () => {
    setOpenTrailingStopDialog(false);
    setSelectedTrade(null);
  };

  const handleSetTrailingStop = () => {
    if (selectedTrade && trailingStopAmount) {
      setTrailingStop(
        selectedTrade.id,
        parseFloat(trailingStopAmount),
        trailingStopType
      );
      handleCloseTrailingStopDialog();
    }
  };

  // Handle edit trade changes
  const handleEditTradeChange = (field: keyof Trade, value: any) => {
    if (editedTrade) {
      setEditedTrade({
        ...editedTrade,
        [field]: value
      });
    }
  };

  // Handle save edited trade
  const handleSaveEditedTrade = () => {
    if (selectedTrade && editedTrade) {
      updateTrade(selectedTrade.id, editedTrade);
      handleCloseEditTradeDialog();
    }
  };

  // Handle toggle for quantity display mode
  const handleQuantityDisplayModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'native' | 'coins' | null,
  ) => {
    if (newMode !== null) {
      setQuantityDisplayMode(newMode);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Trade List
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportClick}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
          >
            Import
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* Export Menu */}
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportJSON}>Export as JSON</MenuItem>
            <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
            <MenuItem onClick={handleExportPartialExitsCSV}>Export Partial Exits as CSV</MenuItem>
            <MenuItem onClick={handleExportZIP}>Export as ZIP with Screenshots</MenuItem>
          </Menu>

          {/* Import Menu */}
          <Menu
            anchorEl={importAnchorEl}
            open={Boolean(importAnchorEl)}
            onClose={handleImportClose}
          >
            <MenuItem onClick={() => {
              fileInputRef.current!.accept = '.json';
              fileInputRef.current!.click();
              setImportType('json');
            }}>
              Import JSON
            </MenuItem>
            <MenuItem onClick={() => {
              fileInputRef.current!.accept = '.csv';
              fileInputRef.current!.click();
              setImportType('csv');
            }}>
              Import CSV
            </MenuItem>
            <MenuItem onClick={() => {
              fileInputRef.current!.accept = '.zip';
              fileInputRef.current!.click();
              setImportType('zip');
            }}>
              Import ZIP (with screenshots)
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Quantity Display Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Quantity Display:
          </Typography>
          <ToggleButtonGroup
            value={quantityDisplayMode}
            exclusive
            onChange={handleQuantityDisplayModeChange}
            aria-label="quantity display mode"
            size="small"
          >
            <ToggleButton value="native" aria-label="native format">
              Native
            </ToggleButton>
            <ToggleButton value="coins" aria-label="coins format">
              Coins
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Active Trades */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Active Trades
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Active Trades
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Details</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Cryptocurrency
                  <IconButton size="small" onClick={() => handleSort('cryptocurrency')}>
                    {sortField === 'cryptocurrency' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Entry Date
                  <IconButton size="small" onClick={() => handleSort('entryDate')}>
                    {sortField === 'entryDate' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Stop Loss</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeTrades.length > 0 ? (
              activeTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => (
                  <React.Fragment key={trade.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleToggleExpand(trade.id)}>
                          {expandedTrades[trade.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {trade.cryptocurrency}
                        {trade.isTrailingStop && (
                          <Chip
                            size="small"
                            label="Trailing"
                            color="secondary"
                            icon={<TrendingUpIcon />}
                            sx={{ ml: 1 }}
                          />
                        )}
                        {trade.partialExits && trade.partialExits.length > 0 && (
                          <Chip
                            size="small"
                            label={`${trade.partialExits.length} Partial Exit${trade.partialExits.length > 1 ? 's' : ''}`}
                            sx={{ ml: 1, bgcolor: '#2196f3', color: 'white' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{trade.name || '-'}</TableCell>
                      <TableCell>${formatFullDecimal(trade.entryPrice)}</TableCell>
                      <TableCell>
                        {trade.remainingQuantity !== undefined
                          ? (quantityDisplayMode === 'native'
                            ? `${formatFullDecimal(trade.remainingQuantity)} / ${formatFullDecimal(trade.originalQuantity || trade.quantity)} ${trade.quantityType === 'coins' ? 'coins' : 'USD'}`
                            : `${formatFullDecimal(trade.quantityType === 'coins' ? trade.remainingQuantity : trade.remainingQuantity / trade.entryPrice)} / ${formatFullDecimal(trade.quantityType === 'coins' ? (trade.originalQuantity || trade.quantity) : (trade.originalQuantity || trade.quantity) / trade.entryPrice)} coins`)
                          : formatQuantity(trade)
                        }
                      </TableCell>
                      <TableCell>
                        ${formatFullDecimal(trade.stopLoss)}
                        {trade.isTrailingStop && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Trailing: {trade.trailingAmount}{trade.trailingType === 'percentage' ? '%' : '$'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <ButtonGroup size="small">
                          <Tooltip title="Edit Trade">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditTradeDialog(trade)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Set Trailing Stop">
                            <IconButton onClick={() => handleOpenTrailingStopDialog(trade)} color="secondary">
                              <TrendingUpIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Partial Close">
                            <IconButton
                              onClick={() => handleOpenPartialCloseDialog(trade)}
                              sx={{ color: '#2196f3' }}
                            >
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Close Trade">
                            <IconButton onClick={() => handleOpenCloseTradeDialog(trade)} color="success">
                              <DoneIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Trade">
                            <IconButton onClick={() => handleOpenDeleteDialog(trade)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>

                    {/* Expanded trade details */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={expandedTrades[trade.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Trade Details
                            </Typography>

                            {trade.name && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Name:</Typography>
                                <Typography variant="body2">{trade.name}</Typography>
                              </Box>
                            )}

                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">Notes:</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEditingNotes(trade)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              {isEditingNotes && expandedTrades[trade.id] ? (
                                <Box sx={{ mt: 1 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={editedNotes}
                                    onChange={(e) => setEditedNotes(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    placeholder="Add your trade notes here..."
                                  />
                                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                      size="small"
                                      onClick={handleCancelEditingNotes}
                                      sx={{ mr: 1, color: 'text.secondary' }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => handleSaveNotes(trade.id)}
                                      variant="contained"
                                      color="primary"
                                    >
                                      Save Notes
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="body2">
                                  {trade.notes || <em>No notes added yet. Click the edit icon to add notes.</em>}
                                </Typography>
                              )}
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">Lessons Learned:</Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEditingLessons(trade)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                              {isEditingLessons && expandedTrades[trade.id] ? (
                                <Box sx={{ mt: 1 }}>
                                  <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    value={editedLessons}
                                    onChange={(e) => setEditedLessons(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    placeholder="Add lessons learned from this trade..."
                                  />
                                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                      size="small"
                                      onClick={handleCancelEditingLessons}
                                      sx={{ mr: 1, color: 'text.secondary' }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => handleSaveLessons(trade.id)}
                                      variant="contained"
                                      color="primary"
                                    >
                                      Save Lessons
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="body2">
                                  {trade.lessonsLearned || <em>No lessons learned added yet. Click the edit icon to add lessons.</em>}
                                </Typography>
                              )}
                            </Box>

                            {trade.partialExits && trade.partialExits.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Partial Exits:</Typography>
                                <List dense>
                                  {trade.partialExits.map((exit) => {
                                    const profitLoss = calculatePartialExitProfitLoss(trade, exit);
                                    const isProfit = profitLoss && profitLoss.value > 0;

                                    return (
                                      <ListItem key={exit.id}>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                              <span>{`${new Date(exit.exitDate).toLocaleDateString()} - ${formatFullDecimal(exit.exitQuantity)} ${trade.quantityType === 'dollars' ? '$' : 'coins'} @ $${formatFullDecimal(exit.exitPrice)}`}</span>
                                              {profitLoss && (
                                                <Typography
                                                  component="span"
                                                  sx={{
                                                    color: isProfit ? 'success.main' : 'error.main',
                                                    fontWeight: 'bold'
                                                  }}
                                                >
                                                  {isProfit ? '+' : ''}{formatFullDecimal(profitLoss.value)}$ ({profitLoss.percentage.toFixed(2)}%)
                                                </Typography>
                                              )}
                                            </Box>
                                          }
                                          secondary={exit.notes}
                                        />
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </Box>
                            )}

                            {trade.isTrailingStop && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Trailing Stop Details:</Typography>
                                <Typography variant="body2">
                                  Amount: {trade.trailingAmount}{trade.trailingType === 'percentage' ? '%' : '$'} |
                                  Reference Price: ${formatFullDecimal(trade.highestPrice || trade.entryPrice)}
                                </Typography>
                              </Box>
                            )}

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2">Risk Analysis:</Typography>
                              <Typography variant="body2">
                                {(() => {
                                  try {
                                    // Check if any required values are undefined, null, or NaN
                                    if (trade.entryPrice === undefined || trade.entryPrice === null ||
                                      trade.stopLoss === undefined || trade.stopLoss === null ||
                                      trade.quantity === undefined || trade.quantity === null) {
                                      return 'Risk: N/A - Missing required values';
                                    }

                                    if (isNaN(trade.entryPrice) || isNaN(trade.stopLoss) || isNaN(trade.quantity)) {
                                      return 'Risk: N/A - Invalid values';
                                    }

                                    const priceDiff = Math.abs(trade.entryPrice - trade.stopLoss);

                                    if (trade.quantityType === 'dollars') {
                                      // For dollar-based positions, risk is a percentage of the position
                                      const stopLossPercentage = priceDiff / trade.entryPrice;
                                      const dollarRisk = trade.quantity * stopLossPercentage;
                                      return `Risk: $${formatFullDecimal(dollarRisk)} (${formatFullDecimal(stopLossPercentage * 100)}% of position)`;
                                    } else {
                                      // For coin-based positions, risk is price difference * quantity
                                      return `Risk: $${formatFullDecimal(priceDiff * trade.quantity)} (${formatFullDecimal(priceDiff)} per coin)`;
                                    }
                                  } catch (error) {
                                    console.error('Error calculating risk:', error, 'Trade:', trade);
                                    return 'Risk: N/A - Error calculating risk';
                                  }
                                })()}
                              </Typography>
                            </Box>

                            {/* Screenshots Section */}
                            {trade.screenshots && trade.screenshots.length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Screenshots
                                </Typography>

                                {/* Group screenshots by type */}
                                {(() => {
                                  // Sort screenshots by timestamp
                                  const sortedScreenshots = [...trade.screenshots].sort((a, b) =>
                                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                  );

                                  // Group by type
                                  const groupedScreenshots: Record<string, Screenshot[]> = {
                                    entry: sortedScreenshots.filter(s => s.type === 'entry'),
                                    exit: sortedScreenshots.filter(s => s.type === 'exit'),
                                    partial: sortedScreenshots.filter(s => s.type === 'partial'),
                                    other: sortedScreenshots.filter(s => s.type === 'other')
                                  };

                                  // Display each group
                                  return (
                                    <>
                                      {Object.entries(groupedScreenshots).map(([type, screenshots]) =>
                                        screenshots.length > 0 && (
                                          <Box key={type} sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" sx={{
                                              textTransform: 'capitalize',
                                              color: type === 'entry' ? 'primary.main' :
                                                type === 'exit' ? 'success.main' :
                                                  type === 'partial' ? 'secondary.main' : 'text.secondary',
                                              fontSize: '0.9rem',
                                              mb: 1
                                            }}>
                                              {type} Screenshots
                                            </Typography>
                                            <Grid container spacing={1}>
                                              {screenshots.map(screenshot => (
                                                <Grid item xs={6} sm={4} md={3} key={screenshot.id}>
                                                  <Card sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    cursor: 'pointer',
                                                    '&:hover': { boxShadow: 3 }
                                                  }} onClick={() => {
                                                    setPreviewImage(screenshot.data);
                                                    setPreviewOpen(true);
                                                  }}>
                                                    <CardMedia
                                                      component="img"
                                                      height="100"
                                                      image={screenshot.data}
                                                      alt={screenshot.label || "Screenshot"}
                                                      sx={{ objectFit: 'cover' }}
                                                    />
                                                    {screenshot.label && (
                                                      <CardContent sx={{ py: 1, px: 1, flexGrow: 1 }}>
                                                        <Typography variant="caption" noWrap>
                                                          {screenshot.label}
                                                        </Typography>
                                                      </CardContent>
                                                    )}
                                                    <CardContent sx={{ py: 0.5, px: 1 }}>
                                                      <Typography variant="caption" color="text.secondary">
                                                        {new Date(screenshot.timestamp).toLocaleString()}
                                                      </Typography>
                                                    </CardContent>
                                                  </Card>
                                                </Grid>
                                              ))}
                                            </Grid>
                                          </Box>
                                        )
                                      )}
                                    </>
                                  );
                                })()}
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No active trades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {activeTrades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={activeTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      {/* Closed Trades */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Closed Trades
      </Typography>
      <TableContainer component={Paper}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Closed Trades
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Details</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Cryptocurrency
                  <IconButton size="small" onClick={() => handleSort('cryptocurrency')}>
                    {sortField === 'cryptocurrency' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Entry Date
                  <IconButton size="small" onClick={() => handleSort('entryDate')}>
                    {sortField === 'entryDate' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Exit Date
                  <IconButton size="small" onClick={() => handleSort('exitDate')}>
                    {sortField === 'exitDate' && sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                  </IconButton>
                </Box>
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Profit/Loss</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closedTrades.length > 0 ? (
              closedTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => {
                  const profitLoss = calculateProfitLoss(trade);

                  return (
                    <React.Fragment key={trade.id}>
                      <TableRow>
                        <TableCell>
                          <IconButton size="small" onClick={() => handleToggleExpand(trade.id)}>
                            {expandedTrades[trade.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          {trade.cryptocurrency}
                          {trade.partialExits && trade.partialExits.length > 0 && (
                            <Chip
                              size="small"
                              label={`${trade.partialExits.length} Partial Exit${trade.partialExits.length > 1 ? 's' : ''}`}
                              sx={{ ml: 1, bgcolor: '#2196f3', color: 'white' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{trade.exitDate ? new Date(trade.exitDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{trade.name || '-'}</TableCell>
                        <TableCell>${formatFullDecimal(trade.entryPrice)}</TableCell>
                        <TableCell>${trade.exitPrice ? formatFullDecimal(trade.exitPrice) : '-'}</TableCell>
                        <TableCell>
                          {formatQuantity(trade)}
                        </TableCell>
                        <TableCell>
                          {profitLoss ? (
                            <Box sx={{ color: profitLoss.value >= 0 ? 'success.main' : 'error.main' }}>
                              ${formatFullDecimal(profitLoss.value)} ({profitLoss.percentage.toFixed(2)}%)
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <ButtonGroup size="small">
                            <Tooltip title="Edit Trade">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditTradeDialog(trade)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Trade">
                              <IconButton onClick={() => handleOpenDeleteDialog(trade)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ButtonGroup>
                        </TableCell>
                      </TableRow>

                      {/* Expanded trade details */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedTrades[trade.id]} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Trade Details
                              </Typography>

                              {trade.name && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2">Name:</Typography>
                                  <Typography variant="body2">{trade.name}</Typography>
                                </Box>
                              )}

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">Notes:</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStartEditingNotes(trade)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {isEditingNotes && expandedTrades[trade.id] ? (
                                  <Box sx={{ mt: 1 }}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={4}
                                      value={editedNotes}
                                      onChange={(e) => setEditedNotes(e.target.value)}
                                      variant="outlined"
                                      size="small"
                                      placeholder="Add your trade notes here..."
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                      <Button
                                        size="small"
                                        onClick={handleCancelEditingNotes}
                                        sx={{ mr: 1, color: 'text.secondary' }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="small"
                                        onClick={() => handleSaveNotes(trade.id)}
                                        variant="contained"
                                        color="primary"
                                      >
                                        Save Notes
                                      </Button>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography variant="body2">
                                    {trade.notes || <em>No notes added yet. Click the edit icon to add notes.</em>}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">Lessons Learned:</Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStartEditingLessons(trade)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                {isEditingLessons && expandedTrades[trade.id] ? (
                                  <Box sx={{ mt: 1 }}>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={4}
                                      value={editedLessons}
                                      onChange={(e) => setEditedLessons(e.target.value)}
                                      variant="outlined"
                                      size="small"
                                      placeholder="Add lessons learned from this trade..."
                                    />
                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                      <Button
                                        size="small"
                                        onClick={handleCancelEditingLessons}
                                        sx={{ mr: 1, color: 'text.secondary' }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="small"
                                        onClick={() => handleSaveLessons(trade.id)}
                                        variant="contained"
                                        color="primary"
                                      >
                                        Save Lessons
                                      </Button>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography variant="body2">
                                    {trade.lessonsLearned || <em>No lessons learned added yet. Click the edit icon to add lessons.</em>}
                                  </Typography>
                                )}
                              </Box>

                              {trade.partialExits && trade.partialExits.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2">Partial Exits:</Typography>
                                  <List dense>
                                    {trade.partialExits.map((exit) => {
                                      const profitLoss = calculatePartialExitProfitLoss(trade, exit);
                                      const isProfit = profitLoss && profitLoss.value > 0;

                                      return (
                                        <ListItem key={exit.id}>
                                          <ListItemText
                                            primary={
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{`${new Date(exit.exitDate).toLocaleDateString()} - ${formatFullDecimal(exit.exitQuantity)} ${trade.quantityType === 'dollars' ? '$' : 'coins'} @ $${formatFullDecimal(exit.exitPrice)}`}</span>
                                                {profitLoss && (
                                                  <Typography
                                                    component="span"
                                                    sx={{
                                                      color: isProfit ? 'success.main' : 'error.main',
                                                      fontWeight: 'bold'
                                                    }}
                                                  >
                                                    {isProfit ? '+' : ''}{formatFullDecimal(profitLoss.value)}$ ({profitLoss.percentage.toFixed(2)}%)
                                                  </Typography>
                                                )}
                                              </Box>
                                            }
                                            secondary={exit.notes}
                                          />
                                        </ListItem>
                                      );
                                    })}
                                  </List>
                                </Box>
                              )}

                              {trade.isTrailingStop && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2">Trailing Stop Details:</Typography>
                                  <Typography variant="body2">
                                    Amount: {trade.trailingAmount}{trade.trailingType === 'percentage' ? '%' : '$'} |
                                    Reference Price: ${formatFullDecimal(trade.highestPrice || trade.entryPrice)}
                                  </Typography>
                                </Box>
                              )}

                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2">Risk Analysis:</Typography>
                                <Typography variant="body2">
                                  {(() => {
                                    try {
                                      // Check if any required values are undefined, null, or NaN
                                      if (trade.entryPrice === undefined || trade.entryPrice === null ||
                                        trade.stopLoss === undefined || trade.stopLoss === null ||
                                        trade.quantity === undefined || trade.quantity === null) {
                                        return 'Risk: N/A - Missing required values';
                                      }

                                      if (isNaN(trade.entryPrice) || isNaN(trade.stopLoss) || isNaN(trade.quantity)) {
                                        return 'Risk: N/A - Invalid values';
                                      }

                                      const priceDiff = Math.abs(trade.entryPrice - trade.stopLoss);

                                      if (trade.quantityType === 'dollars') {
                                        // For dollar-based positions, risk is a percentage of the position
                                        const stopLossPercentage = priceDiff / trade.entryPrice;
                                        const dollarRisk = trade.quantity * stopLossPercentage;
                                        return `Risk: $${formatFullDecimal(dollarRisk)} (${formatFullDecimal(stopLossPercentage * 100)}% of position)`;
                                      } else {
                                        // For coin-based positions, risk is price difference * quantity
                                        return `Risk: $${formatFullDecimal(priceDiff * trade.quantity)} (${formatFullDecimal(priceDiff)} per coin)`;
                                      }
                                    } catch (error) {
                                      console.error('Error calculating risk:', error, 'Trade:', trade);
                                      return 'Risk: N/A - Error calculating risk';
                                    }
                                  })()}
                                </Typography>
                              </Box>

                              {/* Screenshots Section */}
                              {trade.screenshots && trade.screenshots.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Screenshots
                                  </Typography>

                                  {/* Group screenshots by type */}
                                  {(() => {
                                    // Sort screenshots by timestamp
                                    const sortedScreenshots = [...trade.screenshots].sort((a, b) =>
                                      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                    );

                                    // Group by type
                                    const groupedScreenshots: Record<string, Screenshot[]> = {
                                      entry: sortedScreenshots.filter(s => s.type === 'entry'),
                                      exit: sortedScreenshots.filter(s => s.type === 'exit'),
                                      partial: sortedScreenshots.filter(s => s.type === 'partial'),
                                      other: sortedScreenshots.filter(s => s.type === 'other')
                                    };

                                    // Display each group
                                    return (
                                      <>
                                        {Object.entries(groupedScreenshots).map(([type, screenshots]) =>
                                          screenshots.length > 0 && (
                                            <Box key={type} sx={{ mb: 2 }}>
                                              <Typography variant="subtitle2" sx={{
                                                textTransform: 'capitalize',
                                                color: type === 'entry' ? 'primary.main' :
                                                  type === 'exit' ? 'success.main' :
                                                    type === 'partial' ? 'secondary.main' : 'text.secondary',
                                                fontSize: '0.9rem',
                                                mb: 1
                                              }}>
                                                {type} Screenshots
                                              </Typography>
                                              <Grid container spacing={1}>
                                                {screenshots.map(screenshot => (
                                                  <Grid item xs={6} sm={4} md={3} key={screenshot.id}>
                                                    <Card sx={{
                                                      height: '100%',
                                                      display: 'flex',
                                                      flexDirection: 'column',
                                                      cursor: 'pointer',
                                                      '&:hover': { boxShadow: 3 }
                                                    }} onClick={() => {
                                                      setPreviewImage(screenshot.data);
                                                      setPreviewOpen(true);
                                                    }}>
                                                      <CardMedia
                                                        component="img"
                                                        height="100"
                                                        image={screenshot.data}
                                                        alt={screenshot.label || "Screenshot"}
                                                        sx={{ objectFit: 'cover' }}
                                                      />
                                                      {screenshot.label && (
                                                        <CardContent sx={{ py: 1, px: 1, flexGrow: 1 }}>
                                                          <Typography variant="caption" noWrap>
                                                            {screenshot.label}
                                                          </Typography>
                                                        </CardContent>
                                                      )}
                                                      <CardContent sx={{ py: 0.5, px: 1 }}>
                                                        <Typography variant="caption" color="text.secondary">
                                                          {new Date(screenshot.timestamp).toLocaleString()}
                                                        </Typography>
                                                      </CardContent>
                                                    </Card>
                                                  </Grid>
                                                ))}
                                              </Grid>
                                            </Box>
                                          )
                                        )}
                                      </>
                                    );
                                  })()}
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No closed trades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {closedTrades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={closedTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      {/* Close Trade Dialog */}
      <Dialog open={openCloseTradeDialog} onClose={handleCloseCloseTradeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Close Trade</DialogTitle>
        <DialogContent>
          {selectedTrade && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {selectedTrade.cryptocurrency}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Entry Price: ${selectedTrade.entryPrice}
              </Typography>

              {/* Exit Price Options */}
              <Box sx={{ mb: 2, mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quick Exit Options:
                </Typography>
                <ButtonGroup size="small" sx={{ mb: 1 }}>
                  <Button 
                    onClick={() => handleExitPriceOptionChange('stopLoss')}
                    variant={exitPriceOption === 'stopLoss' ? 'contained' : 'outlined'}
                    color="error"
                  >
                    Stop Loss
                  </Button>
                  <Button 
                    onClick={() => handleExitPriceOptionChange('entry')}
                    variant={exitPriceOption === 'entry' ? 'contained' : 'outlined'}
                    color="warning"
                  >
                    Break Even
                  </Button>
                  <Button 
                    onClick={() => handleSetRMultipleExit(1)}
                    variant="outlined"
                    color="info"
                  >
                    1R
                  </Button>
                  <Button 
                    onClick={() => handleSetRMultipleExit(2)}
                    variant="outlined"
                    color="success"
                  >
                    2R
                  </Button>
                  <Button 
                    onClick={() => handleSetRMultipleExit(3)}
                    variant="outlined"
                    color="success"
                  >
                    3R
                  </Button>
                </ButtonGroup>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="Exit Price"
                    type="number"
                    fullWidth
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="Exit Date"
                    type="date"
                    fullWidth
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    margin="dense"
                    label="Trading Fees"
                    type="number"
                    fullWidth
                    value={exitFees}
                    onChange={(e) => setExitFees(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{exitFeesType === 'percentage' ? '%' : '$'}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="exit-fees-type-label">Fees Type</InputLabel>
                    <Select
                      labelId="exit-fees-type-label"
                      value={exitFeesType}
                      onChange={(e) => setExitFeesType(e.target.value as 'percentage' | 'fixed')}
                      label="Fees Type"
                    >
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Add Screenshot Uploader */}
              <Box sx={{ mt: 3 }}>
                <ScreenshotUploader
                  screenshots={exitScreenshots}
                  onScreenshotsChange={setExitScreenshots}
                  screenshotType="exit"
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCloseTradeDialog}>Cancel</Button>
          <Button onClick={handleCloseTrade} variant="contained" color="primary">
            Close Trade
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Trade Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Trade</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trade? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTrade}
            variant="contained"
            color="error"
            sx={{ px: 3 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Partial Close Dialog */}
      <Dialog open={openPartialCloseDialog} onClose={handleClosePartialCloseDialog}>
        <DialogTitle>Partial Close Trade</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedTrade?.cryptocurrency}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Entry Price: ${selectedTrade?.entryPrice}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Stop Loss: ${selectedTrade?.stopLoss}
            </Typography>
            <Typography variant="body2" gutterBottom>
              {selectedTrade && (() => {
                try {
                  // Check if any required values are undefined, null, or NaN
                  if (selectedTrade.entryPrice === undefined || selectedTrade.entryPrice === null ||
                    selectedTrade.stopLoss === undefined || selectedTrade.stopLoss === null ||
                    selectedTrade.quantity === undefined || selectedTrade.quantity === null) {
                    return 'Risk: N/A - Missing required values';
                  }

                  if (isNaN(selectedTrade.entryPrice) || isNaN(selectedTrade.stopLoss) || isNaN(selectedTrade.quantity) ||
                    selectedTrade.entryPrice === 0) { // Avoid division by zero
                    return 'Risk: N/A - Invalid values';
                  }

                  const priceDiff = Math.abs(selectedTrade.entryPrice - selectedTrade.stopLoss);

                  if (selectedTrade.quantityType === 'dollars') {
                    // For dollar-based positions, risk is a percentage of the position
                    const stopLossPercentage = priceDiff / selectedTrade.entryPrice;
                    const dollarRisk = selectedTrade.quantity * stopLossPercentage;
                    return `Risk: $${formatFullDecimal(dollarRisk)} (${formatFullDecimal(stopLossPercentage * 100)}% of position)`;
                  } else {
                    // For coin-based positions, risk is price difference * quantity
                    return `Risk: $${formatFullDecimal(priceDiff * selectedTrade.quantity)} (${formatFullDecimal(priceDiff)} per coin)`;
                  }
                } catch (error) {
                  console.error('Error calculating risk:', error, 'Trade:', selectedTrade);
                  return 'Risk: N/A - Error calculating risk';
                }
              })()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Available Quantity: {selectedTrade ? (selectedTrade.remainingQuantity !== undefined ? selectedTrade.remainingQuantity : selectedTrade.quantity) : ''} {selectedTrade?.quantityType === 'dollars' ? '$' : 'coins'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preset Exit Prices:
              </Typography>
              {/* Partial Close Dialog preset buttons for exit prices */}
              <ButtonGroup size="small" sx={{ mb: 1 }}>
                <Button
                  onClick={() => handleExitPriceOptionChange('entry')}
                  variant="contained"
                  color="primary"
                >
                  Entry
                </Button>
                <Button
                  onClick={() => handleExitPriceOptionChange('stopLoss')}
                  variant="contained"
                  color="primary"
                >
                  Stop Loss
                </Button>
                <Button
                  onClick={() => handleSetRMultipleExit(1)}
                  variant="contained"
                  color="primary"
                >
                  1R
                </Button>
                <Button
                  onClick={() => handleSetRMultipleExit(2)}
                  variant="contained"
                  color="primary"
                >
                  2R
                </Button>
                <Button
                  onClick={() => handleSetRMultipleExit(3)}
                  variant="contained"
                  color="primary"
                >
                  3R
                </Button>
              </ButtonGroup>

              {selectedTrade && (
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {[1, 2, 3].map(r => {
                    const isShort = selectedTrade.cryptocurrency.toLowerCase().includes('short');
                    const priceDiff = Math.abs(selectedTrade.entryPrice - selectedTrade.stopLoss);
                    const rPrice = isShort
                      ? selectedTrade.entryPrice - (priceDiff * r)
                      : selectedTrade.entryPrice + (priceDiff * r);

                    return (
                      <Chip
                        key={r}
                        label={`${r}R = $${formatFullDecimal(rPrice)}`}
                        size="small"
                        sx={{
                          bgcolor: r === 1 ? '#2196f3' : r === 2 ? '#9c27b0' : '#4caf50',
                          color: 'white'
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            <TextField
              margin="dense"
              label="Exit Price"
              type="number"
              fullWidth
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preset Quantities:
              </Typography>
              {/* Partial Close Dialog preset buttons for quantities */}
              <ButtonGroup size="small" sx={{ mb: 1 }}>
                <Button
                  onClick={() => handleSetPartialPosition(25)}
                  variant="contained"
                  color="primary"
                >
                  25%
                </Button>
                <Button
                  onClick={() => handleSetPartialPosition(50)}
                  variant="contained"
                  color="primary"
                >
                  50%
                </Button>
                <Button
                  onClick={() => handleSetPartialPosition(75)}
                  variant="contained"
                  color="primary"
                >
                  75%
                </Button>
                <Button
                  onClick={() => handleSetPartialPosition(100)}
                  variant="contained"
                  color="primary"
                >
                  100%
                </Button>
              </ButtonGroup>
            </Box>

            <TextField
              margin="dense"
              label="Quantity to Close"
              type="number"
              fullWidth
              value={partialExitQuantity}
              onChange={(e) => setPartialExitQuantity(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{selectedTrade?.quantityType === 'dollars' ? '$' : 'coins'}</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Trading Fees"
              type="number"
              fullWidth
              value={partialExitFees}
              onChange={(e) => setPartialExitFees(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{partialExitFeesType === 'percentage' ? '%' : '$'}</InputAdornment>,
              }}
              helperText="Trading fees as a percentage or fixed amount"
            />

            <ToggleButtonGroup
              value={partialExitFeesType}
              exclusive
              onChange={(e, value) => value && setPartialExitFeesType(value)}
              aria-label="fees type"
              size="small"
              sx={{ mt: 1, mb: 2 }}
            >
              <ToggleButton value="percentage" aria-label="percentage">
                Percentage
              </ToggleButton>
              <ToggleButton value="fixed" aria-label="fixed amount">
                Fixed $
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              margin="dense"
              label="Notes (optional)"
              fullWidth
              multiline
              rows={2}
              value={partialExitNotes}
              onChange={(e) => setPartialExitNotes(e.target.value)}
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClosePartialCloseDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePartialCloseTrade}
            variant="contained"
            color="primary"
            sx={{ px: 3 }}
          >
            Partial Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trailing Stop Dialog */}
      <Dialog open={openTrailingStopDialog} onClose={handleCloseTrailingStopDialog}>
        <DialogTitle>Set Trailing Stop</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Set a trailing stop that will automatically adjust as the price moves in your favor.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedTrade?.cryptocurrency}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current Stop Loss: ${selectedTrade?.stopLoss}
            </Typography>

            <TextField
              margin="dense"
              label="Trailing Amount"
              type="number"
              fullWidth
              value={trailingStopAmount}
              onChange={(e) => setTrailingStopAmount(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{trailingStopType === 'percentage' ? '%' : '$'}</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            <ToggleButtonGroup
              value={trailingStopType}
              exclusive
              onChange={(e, value) => value && setTrailingStopType(value)}
              aria-label="trailing type"
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="percentage" aria-label="percentage">
                Percentage
              </ToggleButton>
              <ToggleButton value="fixed" aria-label="fixed amount">
                Fixed Amount
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography variant="body2" color="text.secondary">
              {trailingStopType === 'percentage'
                ? `The stop loss will trail ${trailingStopAmount}% behind the highest price reached.`
                : `The stop loss will trail $${trailingStopAmount} behind the highest price reached.`
              }
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseTrailingStopDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSetTrailingStop}
            variant="contained"
            color="secondary"
            sx={{ px: 3 }}
          >
            Set Trailing Stop
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Trade Dialog */}
      <Dialog open={openEditTradeDialog} onClose={handleCloseEditTradeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Trade</DialogTitle>
        <DialogContent>
          {editedTrade && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Cryptocurrency"
                  type="text"
                  fullWidth
                  value={editedTrade.cryptocurrency}
                  onChange={(e) => handleEditTradeChange('cryptocurrency', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Name"
                  type="text"
                  fullWidth
                  value={editedTrade.name || ''}
                  onChange={(e) => handleEditTradeChange('name', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Entry Price"
                  type="text"
                  fullWidth
                  value={editedTrade.entryPrice ? formatFullDecimal(editedTrade.entryPrice) : ''}
                  onChange={(e) => handleEditTradeChange('entryPrice', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Exit Price"
                  type="text"
                  fullWidth
                  value={editedTrade.exitPrice ? formatFullDecimal(editedTrade.exitPrice) : ''}
                  onChange={(e) => handleEditTradeChange('exitPrice', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={editedTrade.quantity}
                  onChange={(e) => handleEditTradeChange('quantity', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Stop Loss"
                  type="text"
                  fullWidth
                  value={editedTrade.stopLoss ? formatFullDecimal(editedTrade.stopLoss) : ''}
                  onChange={(e) => handleEditTradeChange('stopLoss', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Trading Fees"
                  type="number"
                  fullWidth
                  value={editedTrade.fees}
                  onChange={(e) => handleEditTradeChange('fees', parseFloat(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">{editedTrade.feesType === 'percentage' ? '%' : '$'}</InputAdornment>,
                  }}
                  helperText="Trading fees as a percentage or fixed amount"
                />
              </Grid>
              <Grid item xs={12}>
                <ToggleButtonGroup
                  value={editedTrade.feesType}
                  exclusive
                  onChange={(e, value) => value && handleEditTradeChange('feesType', value)}
                  aria-label="fees type"
                  size="small"
                  sx={{ mt: 1, mb: 2 }}
                >
                  <ToggleButton value="percentage" aria-label="percentage">
                    Percentage
                  </ToggleButton>
                  <ToggleButton value="fixed" aria-label="fixed amount">
                    Fixed $
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Entry Date"
                  type="datetime-local"
                  fullWidth
                  value={editedTrade.entryDate}
                  onChange={(e) => handleEditTradeChange('entryDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Exit Date"
                  type="datetime-local"
                  fullWidth
                  value={editedTrade.exitDate}
                  onChange={(e) => handleEditTradeChange('exitDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Notes"
                  type="text"
                  fullWidth
                  value={editedTrade.notes}
                  onChange={(e) => handleEditTradeChange('notes', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Lessons Learned"
                  type="text"
                  fullWidth
                  value={editedTrade.lessonsLearned}
                  onChange={(e) => handleEditTradeChange('lessonsLearned', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <ScreenshotUploader
                  screenshots={editedTrade.screenshots || []}
                  onScreenshotsChange={(newScreenshots) =>
                    setEditedTrade(prev => prev ? { ...prev, screenshots: newScreenshots } : null)
                  }
                  screenshotType="other"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditTradeDialog}>Cancel</Button>
          <Button onClick={handleSaveEditedTrade} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stop Loss Dialog */}
      <Dialog open={openStopLossDialog} onClose={handleCloseStopLossDialog}>
        <DialogTitle>Update Stop Loss</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {selectedTrade?.cryptocurrency}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Entry Price: ${selectedTrade?.entryPrice}
            </Typography>
            <Typography variant="body2" gutterBottom>
              Current Stop Loss: ${selectedTrade?.stopLoss}
            </Typography>

            <TextField
              fullWidth
              label="New Stop Loss"
              type="number"
              value={newStopLoss}
              onChange={(e) => setNewStopLoss(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Trading Fees"
              type="number"
              value={stopLossFees}
              onChange={(e) => setStopLossFees(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{stopLossFeesType === 'percentage' ? '%' : '$'}</InputAdornment>,
              }}
              margin="normal"
              helperText="Trading fees as a percentage or fixed amount"
            />

            <ToggleButtonGroup
              value={stopLossFeesType}
              exclusive
              onChange={(e, value) => value && setStopLossFeesType(value)}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseStopLossDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStopLoss}
            variant="contained"
            color="primary"
            sx={{ px: 3 }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Screenshot Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={previewImage}
            alt="Screenshot Preview"
            style={{ width: '100%', height: 'auto' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button
            onClick={() => {
              // Create a temporary anchor element to download the image
              const a = document.createElement('a');
              a.href = previewImage;
              a.download = `screenshot-${new Date().toISOString().replace(/:/g, '-')}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradeList; 