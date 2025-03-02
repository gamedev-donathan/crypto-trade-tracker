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
  Collapse
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
import { Trade, PartialExit } from '../types';

const TradeList: React.FC = () => {
  const { trades, updateStopLoss, closeTrade, closePartialTrade, setTrailingStop, deleteTrade, importTrades, updateTrade } = useTrades();
  
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
  
  // Export/Import state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [importAnchorEl, setImportAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add new state for partial close and trailing stop
  const [openPartialCloseDialog, setOpenPartialCloseDialog] = useState(false);
  const [openTrailingStopDialog, setOpenTrailingStopDialog] = useState(false);
  const [partialExitQuantity, setPartialExitQuantity] = useState('');
  const [partialExitNotes, setPartialExitNotes] = useState('');
  const [partialExitFees, setPartialExitFees] = useState('0.1'); // Default trading fee of 0.1%
  const [partialExitFeesType, setPartialExitFeesType] = useState<'percentage' | 'fixed'>('percentage'); // Default to percentage
  const [trailingAmount, setTrailingAmount] = useState('');
  const [trailingType, setTrailingType] = useState<'percentage' | 'fixed'>('percentage');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  
  // Edit trade dialog state
  const [openEditTradeDialog, setOpenEditTradeDialog] = useState(false);
  const [editedTrade, setEditedTrade] = useState<Partial<Trade>>({});
  
  // Edit notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingLessons, setIsEditingLessons] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedLessons, setEditedLessons] = useState('');
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle stop loss dialog
  const handleOpenStopLossDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setNewStopLoss(formatFullDecimal(trade.stopLoss));
    setStopLossFees(trade.fees ? trade.fees.toString() : '0.1');
    setStopLossFeesType(trade.feesType || 'percentage');
    setOpenStopLossDialog(true);
  };
  
  const handleCloseStopLossDialog = () => {
    setOpenStopLossDialog(false);
    setSelectedTrade(null);
  };
  
  const handleUpdateStopLoss = () => {
    if (selectedTrade && newStopLoss) {
      const stopLossNum = parseFloat(newStopLoss);
      const feesNum = parseFloat(stopLossFees);
      
      if (!isNaN(stopLossNum) && !isNaN(feesNum)) {
        // Update the stop loss
        updateStopLoss(selectedTrade.id, stopLossNum);
        
        // Update the fees
        updateTrade(selectedTrade.id, {
          fees: feesNum,
          feesType: stopLossFeesType
        });
        
        handleCloseStopLossDialog();
      }
    }
  };
  
  // Handle close trade dialog
  const handleOpenCloseTradeDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setExitPrice(trade.entryPrice.toString());
    setExitDate(new Date().toISOString().split('T')[0]);
    setExitPriceOption('custom');
    setExitFees(trade.fees ? trade.fees.toString() : '0.1');
    setExitFeesType(trade.feesType || 'percentage');
    setOpenCloseTradeDialog(true);
  };
  
  const handleCloseTradeDialog = () => {
    setOpenCloseTradeDialog(false);
    setSelectedTrade(null);
  };
  
  const handleCloseTrade = () => {
    if (selectedTrade && exitPrice) {
      const exitPriceNum = parseFloat(exitPrice);
      const exitFeesNum = parseFloat(exitFees);
      
      if (!isNaN(exitPriceNum) && !isNaN(exitFeesNum)) {
        // Update the trade with exit price, date, and fees
        updateTrade(selectedTrade.id, {
          exitPrice: exitPriceNum,
          exitDate: new Date(`${exitDate}T00:00:00`).toISOString(),
          fees: exitFeesNum,
          feesType: exitFeesType
        });
        
        // Close the trade
        closeTrade(selectedTrade.id, exitPriceNum, exitDate);
        
        // Reset and close dialog
        setExitPrice('');
        setExitDate(new Date().toISOString().split('T')[0]);
        setExitFees('0.1');
        setExitFeesType('percentage');
        setOpenCloseTradeDialog(false);
        setSelectedTrade(null);
      }
    }
  };
  
  const handleExitPriceOptionChange = (option: 'custom' | 'entry' | 'stopLoss') => {
    setExitPriceOption(option);
    
    if (selectedTrade) {
      if (option === 'entry') {
        setExitPrice(formatFullDecimal(selectedTrade.entryPrice));
      } else if (option === 'stopLoss') {
        setExitPrice(formatFullDecimal(selectedTrade.stopLoss));
      }
    }
  };
  
  // Add R-multiple exit price function for the close trade dialog
  const handleCloseTradeRMultipleExit = (rMultiple: number) => {
    if (selectedTrade) {
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
      
      setExitPrice(formatFullDecimal(newExitPrice));
      setExitPriceOption('custom');
    }
  };
  
  // Handle delete dialog
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
  
  // Handle sorting
  const handleSort = (field: keyof Trade) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };
  
  // Import menu
  const handleImportClick = (event: React.MouseEvent<HTMLElement>) => {
    setImportAnchorEl(event.currentTarget);
  };

  const handleImportClose = () => {
    setImportAnchorEl(null);
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
        'feesType',
        'isTrailingStop',
        'trailingAmount',
        'trailingType',
        'highestPrice',
        'lowestPrice'
      ].join(',');
      
      // Convert trades to CSV rows
      const rows = trades.map(trade => {
        return [
          trade.id,
          `"${trade.cryptocurrency}"`, // Wrap in quotes to handle commas in names
          trade.coinId,
          `"${trade.name || ''}"`,
          formatFullDecimal(trade.entryPrice),
          trade.exitPrice ? formatFullDecimal(trade.exitPrice) : '',
          formatFullDecimal(trade.quantity),
          trade.quantityType,
          formatFullDecimal(trade.stopLoss),
          trade.entryDate,
          trade.exitDate || '',
          `"${trade.notes || ''}"`, // Wrap in quotes to handle commas in notes
          `"${trade.lessonsLearned || ''}"`,
          trade.isActive,
          trade.fees ? formatFullDecimal(trade.fees) : '0.1',
          trade.feesType || 'percentage',
          trade.isTrailingStop || false,
          trade.trailingAmount ? formatFullDecimal(trade.trailingAmount) : '',
          trade.trailingType || 'percentage',
          trade.highestPrice ? formatFullDecimal(trade.highestPrice) : '',
          trade.lowestPrice ? formatFullDecimal(trade.lowestPrice) : ''
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
              formatFullDecimal(exit.exitPrice),
              formatFullDecimal(exit.exitQuantity),
              `"${exit.notes || ''}"`,
              exit.fees ? formatFullDecimal(exit.fees) : '0.1',
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
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          // Parse JSON
          const importedTrades = JSON.parse(content);
          importTrades(importedTrades);
          setSnackbarMessage(`Successfully imported ${importedTrades.length} trades from JSON`);
          setSnackbarSeverity('success');
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          
          const importedTrades = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = parseCSVLine(line);
            const trade: any = {};
            
            headers.forEach((header, index) => {
              if (header === 'entryPrice' || header === 'exitPrice' || header === 'quantity' || header === 'stopLoss' || 
                  header === 'fees' || header === 'trailingAmount' || header === 'highestPrice' || header === 'lowestPrice') {
                trade[header] = values[index] ? parseFloat(values[index]) : null;
              } else if (header === 'isActive' || header === 'isTrailingStop') {
                trade[header] = values[index] === 'true';
              } else {
                trade[header] = values[index];
              }
            });
            
            // Ensure required fields have default values if missing
            if (!trade.feesType) trade.feesType = 'percentage';
            if (!trade.fees && trade.fees !== 0) trade.fees = 0.1;
            if (!trade.trailingType) trade.trailingType = 'percentage';
            
            return trade as Trade;
          });
          
          importTrades(importedTrades);
          setSnackbarMessage(`Successfully imported ${importedTrades.length} trades from CSV`);
          setSnackbarSeverity('success');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        setSnackbarMessage('Error importing trades. Please check the file format.');
        setSnackbarSeverity('error');
      }
      
      setSnackbarOpen(true);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      setSnackbarMessage('Unsupported file format. Please use JSON or CSV.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Helper function to parse CSV lines correctly (handling quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    
    // Remove quotes from quoted values
    return result.map(value => {
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1);
      }
      return value;
    });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
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
    if (trade.quantityType === 'coins') {
      return formatFullDecimal(trade.quantity);
    } else {
      return `$${formatFullDecimal(trade.quantity)}`;
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
  
  // Add a helper function to format numbers to avoid scientific notation
  const formatFullDecimal = (num: number): string => {
    if (num === 0) return '0';
    
    // Convert to string and check if it uses scientific notation
    const numStr = num.toString();
    if (!numStr.includes('e')) return numStr;
    
    // Handle scientific notation
    return Number(num).toFixed(20).replace(/\.?0+$/, '');
  };
  
  // Handle partial close dialog
  const handleOpenPartialCloseDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setExitPrice(trade.entryPrice.toString());
    setExitDate(new Date().toISOString().split('T')[0]);
    setPartialExitQuantity('');
    setPartialExitNotes('');
    setPartialExitFees(trade.fees ? trade.fees.toString() : '0.1');
    setPartialExitFeesType(trade.feesType || 'percentage');
    setOpenPartialCloseDialog(true);
  };

  // Add new functions for preset partial close amounts
  const handleSetPartialPosition = (percentage: number) => {
    if (selectedTrade) {
      const availableQuantity = selectedTrade.remainingQuantity || selectedTrade.quantity;
      setPartialExitQuantity((availableQuantity * (percentage / 100)).toString());
    }
  };

  // Add new functions for R-multiple exit prices
  const handleSetRMultipleExit = (rMultiple: number) => {
    if (selectedTrade) {
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
      
      setExitPrice(formatFullDecimal(newExitPrice));
      setExitPriceOption('custom');
    }
  };

  const handleClosePartialCloseDialog = () => {
    setOpenPartialCloseDialog(false);
    setSelectedTrade(null);
  };
  
  const handlePartialCloseTrade = () => {
    if (selectedTrade && exitPrice && partialExitQuantity) {
      const exitPriceNum = parseFloat(exitPrice);
      const partialQuantityNum = parseFloat(partialExitQuantity);
      const partialFeesNum = parseFloat(partialExitFees);
      
      if (!isNaN(exitPriceNum) && !isNaN(partialQuantityNum) && !isNaN(partialFeesNum)) {
        // Close part of the trade
        closePartialTrade(
          selectedTrade.id, 
          exitPriceNum, 
          partialQuantityNum, 
          partialExitNotes
        );
        
        // Update the trade with fees for this partial exit
        const partialExits = selectedTrade.partialExits || [];
        const lastPartialExit = partialExits[partialExits.length - 1];
        
        if (lastPartialExit) {
          // Update the last partial exit with fees
          updateTrade(selectedTrade.id, {
            partialExits: [
              ...partialExits.slice(0, -1),
              {
                ...lastPartialExit,
                fees: partialFeesNum,
                feesType: partialExitFeesType
              }
            ]
          });
        }
        
        // Reset and close dialog
        setExitPrice('');
        setPartialExitQuantity('');
        setPartialExitNotes('');
        setPartialExitFees('0.1');
        setPartialExitFeesType('percentage');
        setOpenPartialCloseDialog(false);
        setSelectedTrade(null);
      }
    }
  };
  
  // Handle trailing stop dialog
  const handleOpenTrailingStopDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setTrailingAmount(trade.trailingAmount?.toString() || '2');
    setTrailingType(trade.trailingType || 'percentage');
    setOpenTrailingStopDialog(true);
  };
  
  const handleCloseTrailingStopDialog = () => {
    setOpenTrailingStopDialog(false);
    setSelectedTrade(null);
  };
  
  const handleSetTrailingStop = () => {
    if (selectedTrade && trailingAmount) {
      setTrailingStop(
        selectedTrade.id,
        parseFloat(trailingAmount),
        trailingType
      );
      handleCloseTrailingStopDialog();
    }
  };
  
  // Toggle expanded trade details
  const handleToggleExpand = (tradeId: string) => {
    // If we're closing the current expanded trade or opening a different one, reset editing states
    if (expandedTradeId === tradeId || expandedTradeId !== tradeId) {
      setIsEditingNotes(false);
      setIsEditingLessons(false);
    }
    
    setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
  };
  
  const handleOpenEditTradeDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    
    // Format the entry date to YYYY-MM-DDThh:mm
    const entryDate = trade.entryDate ? new Date(trade.entryDate) : new Date();
    const formattedEntryDate = entryDate.toISOString().slice(0, 16);
    
    // Format the exit date if it exists
    let formattedExitDate = '';
    if (trade.exitDate) {
      const exitDate = new Date(trade.exitDate);
      formattedExitDate = exitDate.toISOString().slice(0, 16);
    }
    
    setEditedTrade({
      name: trade.name || '',
      cryptocurrency: trade.cryptocurrency,
      coinId: trade.coinId,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      quantityType: trade.quantityType,
      stopLoss: trade.stopLoss,
      entryDate: formattedEntryDate,
      exitDate: formattedExitDate || '',
      notes: trade.notes || '',
      lessonsLearned: trade.lessonsLearned || '',
      fees: trade.fees || 0.1,
      feesType: trade.feesType || 'percentage'
    });
    setOpenEditTradeDialog(true);
  };

  const handleCloseEditTradeDialog = () => {
    setOpenEditTradeDialog(false);
    setSelectedTrade(null);
    setEditedTrade({});
  };

  const handleSaveEditedTrade = () => {
    if (selectedTrade && editedTrade) {
      updateTrade(selectedTrade.id, editedTrade);
      handleCloseEditTradeDialog();
    }
  };

  const handleEditTradeChange = (field: keyof Trade, value: any) => {
    setEditedTrade(prev => ({
      ...prev,
      [field]: value
    }));
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
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Trade List
        </Typography>
        <Box>
          <ButtonGroup variant="contained" sx={{ mr: 1 }}>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleExportClick}
              color="primary"
            >
              Export
            </Button>
            <Button
              startIcon={<FileUploadIcon />}
              onClick={handleImportClick}
              color="secondary"
            >
              Import
            </Button>
          </ButtonGroup>
          
          {/* Hidden file input for import */}
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
          </Menu>
          
          {/* Import Menu */}
          <Menu
            anchorEl={importAnchorEl}
            open={Boolean(importAnchorEl)}
            onClose={handleImportClose}
          >
            <MenuItem onClick={handleImportJSON}>Import from JSON</MenuItem>
            <MenuItem onClick={handleImportCSV}>Import from CSV</MenuItem>
          </Menu>
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
                          {expandedTradeId === trade.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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
                      <TableCell>
                        {trade.remainingQuantity !== undefined 
                          ? `${formatFullDecimal(trade.remainingQuantity)} / ${formatFullDecimal(trade.originalQuantity || trade.quantity)}`
                          : formatFullDecimal(trade.quantity)
                        }
                        {trade.quantityType === 'coins' ? ' coins' : ' USD'}
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
                        <Collapse in={expandedTradeId === trade.id} timeout="auto" unmountOnExit>
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
                              {isEditingNotes && expandedTradeId === trade.id ? (
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
                              {isEditingLessons && expandedTradeId === trade.id ? (
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
                                    
                                    if (isNaN(trade.entryPrice) || isNaN(trade.stopLoss) || isNaN(trade.quantity) || 
                                        trade.entryPrice === 0) { // Avoid division by zero
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
            rowsPerPageOptions={[5, 10, 25]}
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cryptocurrency</TableCell>
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
                  const profitLossResult = calculateProfitLoss(trade);
                  const profitLossValue = profitLossResult ? profitLossResult.value : 0;
                  const isProfit = profitLossValue > 0;
                  
                  return (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.cryptocurrency}</TableCell>
                      <TableCell>{trade.name || '-'}</TableCell>
                      <TableCell>${formatFullDecimal(trade.entryPrice)}</TableCell>
                      <TableCell>${formatFullDecimal(trade.exitPrice!)}</TableCell>
                      <TableCell>
                        {formatQuantity(trade)}
                        {trade.fees !== undefined && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Fees: {trade.feesType === 'percentage' ? `${trade.fees}%` : `$${trade.fees}`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography color={isProfit ? 'success.main' : 'error.main'}>
                          {isProfit ? '+' : ''}{formatFullDecimal(profitLossValue)} USD
                          {profitLossResult && ` (${formatFullDecimal(profitLossResult.percentage)}%)`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Trade">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenEditTradeDialog(trade)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleOpenDeleteDialog(trade)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No closed trades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {closedTrades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
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
      <Dialog open={openCloseTradeDialog} onClose={handleCloseTradeDialog}>
        <DialogTitle>Close Trade</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
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
                Select Exit Price:
              </Typography>
              {/* Close Trade Dialog preset buttons */}
              <ButtonGroup size="small" sx={{ mb: 2 }}>
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
                  onClick={() => handleCloseTradeRMultipleExit(1)}
                  variant="contained"
                  color="primary"
                >
                  1R
                </Button>
                <Button 
                  onClick={() => handleCloseTradeRMultipleExit(2)}
                  variant="contained"
                  color="primary"
                >
                  2R
                </Button>
                <Button 
                  onClick={() => handleCloseTradeRMultipleExit(3)}
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
          </Box>
          <TextField
            fullWidth
            label="Exit Price"
            type="number"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Exit Date"
            type="date"
            value={exitDate}
            onChange={(e) => setExitDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Trading Fees"
            type="number"
            value={exitFees}
            onChange={(e) => setExitFees(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{exitFeesType === 'percentage' ? '%' : '$'}</InputAdornment>,
            }}
            margin="normal"
            helperText="Trading fees as a percentage or fixed amount"
          />
          
          <ToggleButtonGroup
            value={exitFeesType}
            exclusive
            onChange={(e, value) => value && setExitFeesType(value)}
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
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseTradeDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCloseTrade} 
            variant="contained" 
            color="success"
            sx={{ px: 3 }}
          >
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
              value={trailingAmount}
              onChange={(e) => setTrailingAmount(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{trailingType === 'percentage' ? '%' : '$'}</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
            
            <ToggleButtonGroup
              value={trailingType}
              exclusive
              onChange={(e, value) => value && setTrailingType(value)}
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
              {trailingType === 'percentage' 
                ? `The stop loss will trail ${trailingAmount}% behind the highest price reached.`
                : `The stop loss will trail $${trailingAmount} behind the highest price reached.`
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
      <Dialog open={openEditTradeDialog} onClose={handleCloseEditTradeDialog}>
        <DialogTitle>Edit Trade</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={editedTrade.name}
            onChange={(e) => handleEditTradeChange('name', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Cryptocurrency"
            type="text"
            fullWidth
            value={editedTrade.cryptocurrency}
            onChange={(e) => handleEditTradeChange('cryptocurrency', e.target.value)}
          />
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
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={editedTrade.quantity}
            onChange={(e) => handleEditTradeChange('quantity', parseFloat(e.target.value))}
          />
          <TextField
            margin="dense"
            label="Quantity Type"
            type="text"
            fullWidth
            value={editedTrade.quantityType}
            onChange={(e) => handleEditTradeChange('quantityType', e.target.value)}
          />
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
          <TextField
            margin="dense"
            label="Entry Date"
            type="datetime-local"
            fullWidth
            value={editedTrade.entryDate}
            onChange={(e) => handleEditTradeChange('entryDate', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Exit Date"
            type="datetime-local"
            fullWidth
            value={editedTrade.exitDate}
            onChange={(e) => handleEditTradeChange('exitDate', e.target.value)}
          />
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
          
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseEditTradeDialog}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEditedTrade} 
            variant="contained" 
            color="primary"
            sx={{ px: 3 }}
          >
            Save
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
    </Box>
  );
};

export default TradeList; 